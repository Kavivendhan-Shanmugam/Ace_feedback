"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Subject } from '@/types/supabase'; // Import Subject
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBatches } from '@/hooks/useBatches'; // New hook for batches

const formSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  period: z.coerce.number().min(1, "Period is required").optional(),
  batch_id: z.string().min(1, "Batch is required"),
  semester_number: z.coerce.number().min(1, "Semester is required").max(8, "Semester must be between 1 and 8"),
});

type SubjectFormValues = z.infer<typeof formSchema>;

interface SubjectFormProps {
  initialData?: Omit<Subject, 'id' | 'created_at' | 'batches'>; // Use Omit to exclude id, created_at, and batches
  onSubmit: (data: SubjectFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const SubjectForm: React.FC<SubjectFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const { batches, loading: batchesLoading } = useBatches(); // Fetch available batches

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      period: undefined,
      batch_id: "",
      semester_number: undefined,
    },
  });

  const handleCancel = () => {
    form.reset(); // Reset form fields on cancel
    onCancel();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Calculus I" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Period (Optional)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 1" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="batch_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch</FormLabel>
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
            {initialData ? "Update Subject" : "Add Subject"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default SubjectForm;