"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2, Upload, Download, FileText, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import * as z from 'zod';
import { ZodError } from 'zod';
import { Textarea } from '@/components/ui/textarea';

// Define the schema for a single row in the CSV
const timetableRowSchema = z.object({
  day_of_week: z.coerce.number().min(1, "Day of week must be 1-7").max(7, "Day of week must be 1-7"),
  subject_name: z.string().min(1, "Subject name is required"),
  period: z.coerce.number().optional().nullable().transform(e => e === null ? undefined : e), // Optional period
  batch_name: z.string().min(1, "Batch name is required"),
  semester_number: z.coerce.number().min(1, "Semester must be 1-8").max(8, "Semester must be 1-8"),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid start time format (HH:MM)"),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid end time format (HH:MM)"),
}).refine(data => data.end_time > data.start_time, {
  message: "End time must be after start time",
  path: ["end_time"],
});

type TimetableRow = z.infer<typeof timetableRowSchema>;

const TimetableBulkUpload: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csvContent = "day_of_week,subject_name,period,batch_name,semester_number,start_time,end_time\n" +
                       "1,Calculus I,,2024-2028,1,09:00,10:00\n" +
                       "1,Physics II,2,2024-2028,1,10:00,11:00\n" +
                       "2,Chemistry I,,2025-2029,2,11:00,12:00";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', 'timetable_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorDetails([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0);
        if (rows.length === 0) {
          throw new Error("The uploaded file is empty.");
        }

        const headers = rows[0].split(',').map(h => h.trim());
        const dataRows = rows.slice(1);

        if (!headers.includes('day_of_week') || !headers.includes('subject_name') || !headers.includes('batch_name') || !headers.includes('semester_number') || !headers.includes('start_time') || !headers.includes('end_time')) {
          throw new Error("CSV headers are missing required columns: day_of_week, subject_name, batch_name, semester_number, start_time, end_time.");
        }

        const parsedData: TimetableRow[] = [];
        const parsingErrors: string[] = [];

        for (let i = 0; i < dataRows.length; i++) {
          const row = dataRows[i];
          const values = row.split(',').map(v => v.trim());
          const rowObject: { [key: string]: string | number | undefined } = {};
          headers.forEach((header, index) => {
            rowObject[header] = values[index];
          });

          try {
            const validatedRow = timetableRowSchema.parse(rowObject);
            parsedData.push(validatedRow);
          } catch (error) {
            if (error instanceof ZodError) {
              parsingErrors.push(`Row ${i + 2} (data row ${i + 1}): ${error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')}`);
            } else {
              parsingErrors.push(`Row ${i + 2} (data row ${i + 1}): ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        }

        if (parsingErrors.length > 0) {
          setErrorDetails(parsingErrors);
          setUploadStatus('error');
          showError("Some rows failed validation. Please check the details below.");
          return;
        }

        // Fetch all subjects and batches to map names to IDs
        const { data: subjects, error: subjectsError } = await supabase.from('subjects').select('id, name, period');
        const { data: batches, error: batchesError } = await supabase.from('batches').select('id, name');

        if (subjectsError || batchesError) {
          throw new Error(`Failed to fetch reference data: ${subjectsError?.message || ''} ${batchesError?.message || ''}`);
        }

        const subjectMap = new Map<string, string>(); // Key: "name_period", Value: id
        subjects?.forEach(sub => {
          const key = sub.period ? `${sub.name}_${sub.period}` : sub.name;
          subjectMap.set(key, sub.id);
        });

        const batchMap = new Map<string, string>(); // Key: name, Value: id
        batches?.forEach(batch => batchMap.set(batch.name, batch.id));

        const entriesToInsert = [];
        const lookupErrors: string[] = [];

        for (let i = 0; i < parsedData.length; i++) {
          const row = parsedData[i];
          const subjectKey = row.period ? `${row.subject_name}_${row.period}` : row.subject_name;
          const subjectId = subjectMap.get(subjectKey);
          const batchId = batchMap.get(row.batch_name);

          if (!subjectId) {
            lookupErrors.push(`Row ${i + 2}: Subject '${row.subject_name}' (Period: ${row.period || 'N/A'}) not found. Please ensure it exists in 'Manage Subjects'.`);
          }
          if (!batchId) {
            lookupErrors.push(`Row ${i + 2}: Batch '${row.batch_name}' not found. Please ensure it exists in 'Manage Batches'.`);
          }

          if (subjectId && batchId) {
            entriesToInsert.push({
              day_of_week: row.day_of_week,
              class_id: subjectId,
              batch_id: batchId,
              semester_number: row.semester_number,
              start_time: row.start_time,
              end_time: row.end_time,
            });
          }
        }

        if (lookupErrors.length > 0) {
          setErrorDetails(lookupErrors);
          setUploadStatus('error');
          showError("Some entries could not be processed due to missing subjects or batches. Please check the details below.");
          return;
        }

        if (entriesToInsert.length === 0) {
          showError("No valid timetable entries found to insert after processing.");
          return;
        }

        // Perform bulk insert
        const { error: insertError } = await supabase.from('timetables').insert(entriesToInsert);

        if (insertError) {
          console.error("Supabase insert error:", insertError);
          setErrorDetails([`Database insertion failed: ${insertError.message}`]);
          setUploadStatus('error');
          showError("Failed to insert timetable entries into the database.");
        } else {
          setUploadStatus('success');
          showSuccess(`Successfully added ${entriesToInsert.length} timetable entries!`);
        }

      } catch (error: any) {
        console.error("File processing error:", error);
        setErrorDetails([error.message || "An unexpected error occurred during file processing."]);
        setUploadStatus('error');
        showError("Failed to process file.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear the file input
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Bulk Upload Timetable</CardTitle>
        <CardDescription>Upload a CSV file to add multiple timetable entries at once.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button onClick={handleDownloadTemplate} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Download Template (CSV)
          </Button>
          <div className="relative w-full sm:w-auto">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              ref={fileInputRef}
              disabled={isUploading}
              id="bulk-upload-file-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" /> Upload CSV
                </>
              )}
            </Button>
          </div>
        </div>

        {uploadStatus === 'success' && (
          <div className="flex items-center p-4 rounded-md bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="h-5 w-5 mr-3" />
            <p>Timetable entries uploaded successfully!</p>
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="p-4 rounded-md bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
            <div className="flex items-center mb-2">
              <XCircle className="h-5 w-5 mr-3" />
              <p className="font-semibold">Upload Failed:</p>
            </div>
            <p className="text-sm mb-2">Please review the following issues:</p>
            <ScrollArea className="h-40 w-full rounded-md border p-4 bg-red-50 dark:bg-red-950">
              <ul className="list-disc list-inside text-sm space-y-1">
                {errorDetails.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}

        <div className="mt-6 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold mb-2 flex items-center">
            <FileText className="mr-2 h-4 w-4" /> Template Instructions:
          </h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>Ensure your CSV file has the exact headers: `day_of_week`, `subject_name`, `period`, `batch_name`, `semester_number`, `start_time`, `end_time`.</li>
            <li>`day_of_week`: Use numbers 1-7 (1 for Monday, 7 for Sunday).</li>
            <li>`subject_name`: Must exactly match an existing subject name.</li>
            <li>`period`: Optional. If your subject names are not unique, use this to specify the period (e.g., "Physics I" Period 1 vs "Physics I" Period 2). Leave blank if not applicable.</li>
            <li>`batch_name`: Must exactly match an existing batch name (e.g., "2024-2028").</li>
            <li>`semester_number`: Use numbers 1-8.</li>
            <li>`start_time` and `end_time`: Use HH:MM format (24-hour, e.g., 09:00, 13:30). End time must be after start time.</li>
            <li>Each row represents one timetable entry.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimetableBulkUpload;