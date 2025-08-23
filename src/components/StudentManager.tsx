"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Trash2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { Profile } from '@/types/supabase';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useStudentManager } from '@/hooks/useStudentManager';
import StudentForm from './StudentForm';
import { useBatches } from '@/hooks/useBatches';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StudentBulkUpload from './StudentBulkUpload';

const StudentManager: React.FC = () => {
  const { students, loading, isSubmitting, addStudent, updateStudent, deleteStudent, fetchStudents } = useStudentManager();
  const { batches } = useBatches();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const batchMap = useMemo(() => new Map(batches.map(b => [b.id, b.name])), [batches]);

  const handleAddStudent = async (values: any) => {
    const newStudent = await addStudent(values);
    if (newStudent) {
      setIsFormOpen(false);
    }
  };

  const handleUpdateStudent = async (values: any) => {
    if (!editingStudent) return;
    const updatedStudent = await updateStudent(editingStudent.id, values);
    if (updatedStudent) {
      setIsFormOpen(false);
      setEditingStudent(null);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudent(id);
  };

  const openEditForm = (student: Profile) => {
    setEditingStudent(student);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingStudent(null);
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Students</CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingStudent(null); setIsFormOpen(true); }}>Add New Student</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
              <DialogDescription>
                {editingStudent ? "Update the student's details." : "Create a new student account."}
              </DialogDescription>
            </DialogHeader>
            {isFormOpen && (
              <StudentForm
                initialData={editingStudent || undefined}
                onSubmit={editingStudent ? handleUpdateStudent : handleAddStudent}
                onCancel={closeForm}
                isSubmitting={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manage">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">Manage Students</TabsTrigger>
            <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="manage" className="mt-4">
            <div className="mb-4">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-8 w-8" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: Profile) => (
                    <TableRow key={student.id}>
                      <TableCell>{student.first_name} {student.last_name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.batch_id ? batchMap.get(student.batch_id) : 'N/A'}</TableCell>
                      <TableCell>{student.semester_number || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center space-x-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="outline" size="icon" onClick={() => openEditForm(student)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Edit Student</p></TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ConfirmAlertDialog
                                title="Are you absolutely sure?"
                                description="This action cannot be undone. This will permanently delete the student's account and all associated data."
                                onConfirm={() => handleDeleteStudent(student.id)}
                              >
                                <Button variant="destructive" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </ConfirmAlertDialog>
                            </TooltipTrigger>
                            <TooltipContent><p>Delete Student</p></TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
          <TabsContent value="bulk-upload" className="mt-4">
            <StudentBulkUpload onUploadSuccess={fetchStudents} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default StudentManager;