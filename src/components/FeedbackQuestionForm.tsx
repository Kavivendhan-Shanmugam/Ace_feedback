"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, PlusCircle, X } from 'lucide-react';
import { FeedbackQuestion } from '@/types/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBatches } from '@/hooks/useBatches';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import BatchForm from './BatchForm';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';

const formSchema = z.object({
  question_text: z.string().min(1, "Question text is required").max(500, "Question cannot exceed 500 characters"),
  question_type: z.enum(['text', 'multiple_choice']),
  options: z.array(z.object({
    value: z.string().min(1, "Option cannot be empty."),
  })).optional(),
  batch_id: z.string().min(1, "Batch is required"),
  semester_number: z.coerce.number().min(1, "Semester is required").max(8, "Semester must be between 1 and 8"),
}).refine(data => {
  if (data.question_type === 'multiple_choice') {
    return data.options && data.options.length >= 2;
  }
  return true;
}, {
  message: "Multiple choice questions must have at least 2 options.",
  path: ["options"],
});

type FeedbackQuestionFormValues = z.infer<typeof formSchema>;

interface FeedbackQuestionFormProps {
  initialData?: Omit<FeedbackQuestion, 'id' | 'created_at' | 'batches'>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const FeedbackQuestionForm: React.FC<FeedbackQuestionFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const { batches, loading: batchesLoading, addBatch, isSubmitting: isSubmittingBatch } = useBatches();
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [currentOption, setCurrentOption] = useState("");

  const form = useForm<FeedbackQuestionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question_text: initialData?.question_text || "",
      question_type: initialData?.question_type || 'text',
      options: initialData?.options?.map(opt => ({ value: opt })) || [],
      batch_id: initialData?.batch_id || "",
      semester_number: initialData?.semester_number || undefined,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const questionType = form.watch("question_type");

  const handleAddOption = () => {
    if (currentOption.trim() !== "") {
      append({ value: currentOption.trim() });
      setCurrentOption("");
    }
  };

  const handleFormSubmit = (values: FeedbackQuestionFormValues) => {
    const submissionData = {
      ...values,
      options: values.question_type === 'multiple_choice'
        ? values.options?.map(opt => opt.value)
        : null,
    };
    onSubmit(submissionData);
  };

  const handleCancel = () => {
    form.reset();
    onCancel();
  };

  const handleAddBatch = async (values: { name: string }) => {
    const newBatch = await addBatch(values);
    if (newBatch) {
      form.setValue('batch_id', newBatch.id, { shouldValidate: true });
      setIsAddBatchOpen(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="question_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a question type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="text">Text (Open-ended)</SelectItem>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="question_text"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Question Text</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., What are your thoughts on the new curriculum?" {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {questionType === 'multiple_choice' && (
          <div className="space-y-2">
            <FormLabel>Options</FormLabel>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add an option"
                value={currentOption}
                onChange={(e) => setCurrentOption(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
              />
              <Button type="button" variant="outline" onClick={handleAddOption}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {fields.map((field, index) => (
                <Badge key={field.id} variant="secondary" className="flex items-center gap-1">
                  {field.value}
                  <button type="button" onClick={() => remove(index)} className="rounded-full hover:bg-muted-foreground/20">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <FormMessage>{form.formState.errors.options?.message}</FormMessage>
          </div>
        )}

        <FormField
          control={form.control}
          name="batch_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch</FormLabel>
              <div className="flex items-center space-x-2">
                <Select onValueChange={field.onChange} value={field.value} disabled={batchesLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a batch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {batches.map((batch) => (
                      <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Dialog open={isAddBatchOpen} onOpenChange={setIsAddBatchOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon" aria-label="Add new batch">
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Batch</DialogTitle>
                      <DialogDescription>
                        Add a new batch to the system. The name will be formatted as YYYY-YYYY.
                      </DialogDescription>
                    </DialogHeader>
                    <BatchForm
                      onSubmit={handleAddBatch}
                      onCancel={() => setIsAddBatchOpen(false)}
                      isSubmitting={isSubmittingBatch}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="semester_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semester</FormLabel>
              <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a semester" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Question" : "Add Question"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default FeedbackQuestionForm;