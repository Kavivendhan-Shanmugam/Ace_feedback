"use client";

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Trash2, Edit, MessageSquareQuestion } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { useFeedbackQuestions } from '@/hooks/useFeedbackQuestions';
import { FeedbackQuestion } from '@/types/supabase';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBatches } from '@/hooks/useBatches';
import FeedbackQuestionForm from './FeedbackQuestionForm';

const FeedbackQuestionManager: React.FC = () => {
  const { feedbackQuestions, loading, isSubmitting, addFeedbackQuestion, updateFeedbackQuestion, deleteFeedbackQuestion } = useFeedbackQuestions();
  const { batches, loading: batchesLoading } = useBatches();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FeedbackQuestion | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');

  const handleAddQuestion = async (values: Omit<FeedbackQuestion, 'id' | 'created_at' | 'batches'>) => {
    const newQuestion = await addFeedbackQuestion(values);
    if (newQuestion) {
      setIsFormOpen(false);
    }
  };

  const handleUpdateQuestion = async (values: Omit<FeedbackQuestion, 'id' | 'created_at' | 'batches'>) => {
    if (!editingQuestion) return;
    const updatedQuestion = await updateFeedbackQuestion(editingQuestion.id, values);
    if (updatedQuestion) {
      setIsFormOpen(false);
      setEditingQuestion(null);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    await deleteFeedbackQuestion(id);
  };

  const openEditForm = (question: FeedbackQuestion) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingQuestion(null);
  };

  const filteredQuestions = useMemo(() => {
    let filtered = feedbackQuestions;

    if (searchTerm) {
      filtered = filtered.filter(question =>
        question.question_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (batchFilter !== 'all') {
      filtered = filtered.filter(question => question.batch_id === batchFilter);
    }

    if (semesterFilter !== 'all') {
      filtered = filtered.filter(question => question.semester_number === parseInt(semesterFilter));
    }

    return filtered;
  }, [feedbackQuestions, searchTerm, batchFilter, semesterFilter]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Feedback Questions</CardTitle>
          <CardDescription>Create and manage questions for student feedback.</CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingQuestion(null); setIsFormOpen(true); }}>Add New Question</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Edit Feedback Question" : "Add New Feedback Question"}</DialogTitle>
              <DialogDescription>
                {editingQuestion ? "Update the question details." : "Create a new question for students to answer."}
              </DialogDescription>
            </DialogHeader>
            {isFormOpen && (
              <FeedbackQuestionForm
                initialData={editingQuestion ? {
                  question_text: editingQuestion.question_text,
                  batch_id: editingQuestion.batch_id || "",
                  semester_number: editingQuestion.semester_number || undefined,
                } : undefined}
                onSubmit={editingQuestion ? handleUpdateQuestion : handleAddQuestion}
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
            placeholder="Search questions..."
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
                <TableHead>Question</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
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
        ) : filteredQuestions.length === 0 ? (
          <p className="text-center py-8">
            {searchTerm || batchFilter !== 'all' || semesterFilter !== 'all' ? 'No questions match your filters.' : 'No feedback questions added yet. Click "Add New Question" to get started.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuestions.map((question: FeedbackQuestion) => (
                <TableRow key={question.id}>
                  <TableCell className="max-w-[200px] truncate">{question.question_text}</TableCell>
                  <TableCell>{question.batches?.name || 'N/A'}</TableCell>
                  <TableCell>{question.semester_number || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => openEditForm(question)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Question</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ConfirmAlertDialog
                            title="Are you absolutely sure?"
                            description="This action cannot be undone. This will permanently delete the feedback question."
                            onConfirm={() => handleDeleteQuestion(question.id)}
                          >
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ConfirmAlertDialog>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Question</p>
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

export default FeedbackQuestionManager;