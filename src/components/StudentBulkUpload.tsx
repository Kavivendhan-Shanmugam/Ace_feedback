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
import { ScrollArea } from '@/components/ui/scroll-area';
import * as XLSX from 'xlsx';
import { useBatches } from '@/hooks/useBatches';

// Schema for a single row in the XLSX
const studentRowSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  batch_name: z.string().min(1, "Batch name is required"),
  semester_number: z.coerce.number().min(1, "Semester must be 1-8").max(8, "Semester must be 1-8"),
});

type StudentRow = z.infer<typeof studentRowSchema>;

interface StudentBulkUploadProps {
  onUploadSuccess: () => void;
}

const StudentBulkUpload: React.FC<StudentBulkUploadProps> = ({ onUploadSuccess }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [successDetails, setSuccessDetails] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { batches, loading: batchesLoading } = useBatches();

  const handleDownloadTemplate = () => {
    const ws_data = [
      ["email", "password", "first_name", "last_name", "batch_name", "semester_number"],
      ["student1@example.com", "password123", "John", "Doe", "2024-2028", 1],
      ["student2@example.com", "securepass", "Jane", "Smith", "2023-2027", 3],
    ];
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "student_upload_template.xlsx");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadStatus('idle');
    setErrorDetails([]);
    setSuccessDetails([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        if (json.length === 0) throw new Error("The uploaded file is empty.");

        const parsedData: StudentRow[] = [];
        const parsingErrors: string[] = [];

        for (let i = 0; i < json.length; i++) {
          try {
            const validatedRow = studentRowSchema.parse(json[i]);
            parsedData.push(validatedRow);
          } catch (error) {
            if (error instanceof ZodError) {
              parsingErrors.push(`Row ${i + 2}: ${error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')}`);
            }
          }
        }

        if (parsingErrors.length > 0) {
          setErrorDetails(parsingErrors);
          setUploadStatus('error');
          showError("Some rows failed validation. Please check the details.");
          return;
        }

        const batchMap = new Map<string, string>(batches.map(b => [b.name, b.id]));
        const usersToInsert = [];
        const lookupErrors: string[] = [];

        for (let i = 0; i < parsedData.length; i++) {
          const row = parsedData[i];
          const batchId = batchMap.get(row.batch_name);

          if (!batchId) {
            lookupErrors.push(`Row ${i + 2}: Batch '${row.batch_name}' not found.`);
          } else {
            usersToInsert.push({ ...row, batch_id: batchId });
          }
        }

        if (lookupErrors.length > 0) {
          setErrorDetails(lookupErrors);
          setUploadStatus('error');
          showError("Some batches were not found. Please check the details.");
          return;
        }

        if (usersToInsert.length === 0) {
          showError("No valid students found to upload.");
          return;
        }

        const { data: result, error: invokeError } = await supabase.functions.invoke('create-users-bulk', {
          body: { users: usersToInsert },
        });

        if (invokeError) throw new Error(invokeError.message);

        const { success, failed } = result;
        setSuccessDetails(success.map((s: any) => `${s.email}: ${s.message}`));
        setErrorDetails(failed.map((f: any) => `${f.email}: ${f.error}`));

        if (failed.length > 0) {
          setUploadStatus('error');
          showError(`Processed ${success.length} students successfully, but ${failed.length} failed.`);
        } else {
          setUploadStatus('success');
          showSuccess(`Successfully created ${success.length} students!`);
          onUploadSuccess();
        }

      } catch (error: any) {
        setErrorDetails([error.message || "An unexpected error occurred."]);
        setUploadStatus('error');
        showError("Failed to process file.");
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Bulk Upload Students</CardTitle>
        <CardDescription>Upload an XLSX file to create multiple student accounts at once.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button onClick={handleDownloadTemplate} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" /> Download Template (XLSX)
          </Button>
          <div className="relative w-full sm:w-auto">
            <Input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              className="hidden"
              ref={fileInputRef}
              disabled={isUploading || batchesLoading}
              id="student-bulk-upload-input"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || batchesLoading}
              className="w-full sm:w-auto"
            >
              {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : <><Upload className="mr-2 h-4 w-4" /> Upload XLSX</>}
            </Button>
          </div>
        </div>

        {(uploadStatus === 'success' || errorDetails.length > 0) && (
          <div className="p-4 rounded-md border">
            <h3 className="font-semibold mb-2">Upload Summary</h3>
            {successDetails.length > 0 && (
              <div className="p-2 rounded-md bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 mb-2">
                <div className="flex items-center font-semibold"><CheckCircle className="h-5 w-5 mr-2" /> Success ({successDetails.length})</div>
                <ScrollArea className="h-24 mt-2">
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {successDetails.map((msg, i) => <li key={i}>{msg}</li>)}
                  </ul>
                </ScrollArea>
              </div>
            )}
            {errorDetails.length > 0 && (
              <div className="p-2 rounded-md bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <div className="flex items-center font-semibold"><XCircle className="h-5 w-5 mr-2" /> Errors ({errorDetails.length})</div>
                <ScrollArea className="h-24 mt-2">
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {errorDetails.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold mb-2 flex items-center"><FileText className="mr-2 h-4 w-4" /> Instructions</h3>
          <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
            <li>Use the template. Headers must be: `email`, `password`, `first_name`, `last_name`, `batch_name`, `semester_number`.</li>
            <li>`password` must be at least 6 characters long.</li>
            <li>`batch_name` must exactly match an existing batch name (e.g., "2024-2028").</li>
            <li>`semester_number` must be a number between 1 and 8.</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentBulkUpload;