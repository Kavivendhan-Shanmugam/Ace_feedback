"use client";

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import SubjectForm from './SubjectForm'; // Renamed import
import { Trash2, Edit, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { useSubjects } from '@/hooks/useSubjects'; // Renamed import
import { Subject } from '@/types/supabase'; // Renamed import
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBatches } from '@/hooks/useBatches';

const SubjectManager: React.FC = () => {
  const { subjects, loading, isSubmitting, addSubject, updateSubject, deleteSubject } = useSubjects(); // Renamed hook functions
  const { batches, loading: batchesLoading } = useBatches();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');

  const handleAddSubject = async (values: Omit<Subject, 'id' | 'created_at' | 'batches'>) => {
    const newSubject = await addSubject(values);
    if (newSubject) {
      setIsFormOpen(false);
    }
  };

  const handleUpdateSubject = async (values: Omit<Subject, 'id' | 'created_at' | 'batches'>) => {
    if (!editingSubject) return;
    const updatedSubject = await updateSubject(editingSubject.id, values);
    if (updatedSubject) {
      setIsFormOpen(false);
      setEditingSubject(null);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    await deleteSubject(id);
  };

  const openEditForm = (sub: Subject) => {
    setEditingSubject(sub);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSubject(null);
  };

  const filteredSubjects = useMemo(() => {
    let filtered = subjects;

    if (searchTerm) {
      filtered = filtered.filter(subject =>
        subject.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (batchFilter !== 'all') {
      filtered = filtered.filter(subject => subject.batch_id === batchFilter);
    }

    if (semesterFilter !== 'all') {
      filtered = filtered.filter(subject => subject.semester_number === parseInt(semesterFilter));
    }

    return filtered;
  }, [subjects, searchTerm, batchFilter, semesterFilter]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Subjects</CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingSubject(null); setIsFormOpen(true); }}>Add New Subject</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
              <DialogDescription>
                Make changes to the subject here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            {isFormOpen && (
              <SubjectForm
                initialData={editingSubject ? {
                  name: editingSubject.name,
                  period: editingSubject.period || undefined,
                  batch_id: editingSubject.batch_id || "",
                  semester_number: editingSubject.semester_number || undefined,
                } : undefined}
                onSubmit={editingSubject ? handleUpdateSubject : handleAddSubject}
                onCancel={closeForm}
                isSubmitting={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Input
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : filteredSubjects.length === 0 ? (
          <p className="text-center py-8">
            {searchTerm || batchFilter !== 'all' || semesterFilter !== 'all' ? 'No subjects match your filters.' : 'No subjects added yet. Click "Add New Subject" to get started.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject Name</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.map((sub: Subject) => (
                <TableRow key={sub.id}>
                  <TableCell>{sub.name} {sub.period ? `(P${sub.period})` : ''}</TableCell>
                  <TableCell>{sub.batches?.name || 'N/A'}</TableCell>
                  <TableCell>{sub.semester_number || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button asChild variant="outline" size="icon">
                            <Link to="/admin/feedback" state={{ subjectId: sub.id }}>
                              <MessageSquare className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View Feedback</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => openEditForm(sub)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Subject</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ConfirmAlertDialog
                            title="Are you absolutely sure?"
                            description="This action cannot be undone. This will permanently delete the subject and any associated feedback and timetable entries."
                            onConfirm={() => handleDeleteSubject(sub.id)}
                          >
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ConfirmAlertDialog>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Subject</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SubjectManager;