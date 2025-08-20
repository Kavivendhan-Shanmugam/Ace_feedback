"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trash2, Edit, PlusCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { useTimetable } from '@/hooks/useTimetable';
import { TimetableEntry } from '@/types/supabase';
import TimetableForm from './TimetableForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBatches } from '@/hooks/useBatches';
import { formatTime } from '@/lib/utils'; // Import the new utility

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

const TimetableManager: React.FC = () => {
  const { timetableEntries, availableSubjects, loading, isSubmitting, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry } = useTimetable();
  const { batches, loading: batchesLoading } = useBatches();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formInitialData, setFormInitialData] = useState<Partial<Parameters<typeof TimetableForm>[0]['initialData']>>({});
  const [batchFilter, setBatchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');

  const filteredTimetableEntries = useMemo(() => {
    let filtered = timetableEntries;

    if (batchFilter !== 'all') {
      filtered = filtered.filter(entry => entry.batch_id === batchFilter);
    }

    if (semesterFilter !== 'all') {
      filtered = filtered.filter(entry => entry.semester_number === parseInt(semesterFilter));
    }
    return filtered;
  }, [timetableEntries, batchFilter, semesterFilter]);

  const groupedTimetable = useMemo(() => {
    const groups: { [key: number]: TimetableEntry[] } = {};
    daysOfWeek.forEach(day => (groups[day.value] = []));
    filteredTimetableEntries.forEach(entry => {
      if (entry.subjects) {
        groups[entry.day_of_week].push(entry);
      }
    });
    Object.values(groups).forEach(dayEntries => {
      dayEntries.sort((a, b) => {
        const timeA = a.start_time || '';
        const timeB = b.start_time || '';
        return timeA.localeCompare(timeB);
      });
    });
    return groups;
  }, [filteredTimetableEntries]);

  const handleAddTimetableEntry = async (values: any) => {
    const newEntry = await addTimetableEntry(values);
    if (newEntry) {
      closeForm();
    }
  };

  const handleUpdateTimetableEntry = async (values: any) => {
    if (!editingEntry) return;
    const updated = await updateTimetableEntry(editingEntry.id, values);
    if (updated) {
      closeForm();
    }
  };

  const handleDeleteTimetableEntry = async (id: string) => {
    await deleteTimetableEntry(id);
  };

  const openFormForAdd = (day: number) => {
    setEditingEntry(null);
    setFormInitialData({
      day_of_week: day,
      class_id: "",
      batch_id: batchFilter !== 'all' ? batchFilter : "",
      semester_number: semesterFilter !== 'all' ? parseInt(semesterFilter) : undefined,
      start_time: "08:00",
      end_time: "09:00",
    });
    setIsFormOpen(true);
  };

  const openFormForEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormInitialData({ 
      ...entry,
      class_id: entry.class_id,
      batch_id: entry.batch_id || "",
      semester_number: entry.semester_number || undefined,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
    setFormInitialData({});
  };

  return (
    <Card className="w-full max-w-5xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Manage Weekly Timetable</CardTitle>
        <CardDescription>Add, edit, or remove subjects from the weekly schedule for specific batches and semesters.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Select value={batchFilter} onValueChange={setBatchFilter} disabled={batchesLoading}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map(batch => (
                <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={semesterFilter} onValueChange={setSemesterFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <Tabs defaultValue="1" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {daysOfWeek.map(day => (
                <TabsTrigger key={day.value} value={day.value.toString()}>{day.label}</TabsTrigger>
              ))}
            </TabsList>
            {daysOfWeek.map(day => (
              <TabsContent key={day.value} value={day.value.toString()}>
                <div className="mt-4 space-y-4">
                  {groupedTimetable[day.value].length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No subjects scheduled for {day.label} in the selected filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groupedTimetable[day.value].map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div>
                            <p className="font-semibold">{entry.subjects.name} {entry.subjects.period ? `(P${entry.subjects.period})` : ''}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatTime(entry.start_time)} - {formatTime(entry.end_time)}
                              {entry.batches?.name && ` (${entry.batches.name})`}
                              {entry.semester_number && ` Sem ${entry.semester_number}`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openFormForEdit(entry)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </Button>
                            <ConfirmAlertDialog
                              title="Are you sure?"
                              description="This will permanently remove this subject from the timetable for this day."
                              onConfirm={() => handleDeleteTimetableEntry(entry.id)}
                            >
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </Button>
                            </ConfirmAlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => openFormForAdd(day.value)}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Subject to {day.label}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Timetable Entry" : "Add New Timetable Entry"}</DialogTitle>
          </DialogHeader>
          <TimetableForm
            initialData={formInitialData}
            availableSubjects={availableSubjects}
            onSubmit={editingEntry ? handleUpdateTimetableEntry : handleAddTimetableEntry}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TimetableManager;