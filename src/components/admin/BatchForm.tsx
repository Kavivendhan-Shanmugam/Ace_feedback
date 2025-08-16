"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
});

type BatchFormValues = z.infer<typeof formSchema>;

interface BatchFormProps {
  initialData?: BatchFormValues;
  onSubmit: (data: BatchFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const BatchForm: React.FC<BatchFormProps> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
    },
  });

  const handleCancel = () => {
    form.reset();
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
              <FormLabel>Batch Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 2024-2028 CSE" {...field} />
              </FormControl>
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
            {initialData ? "Update Batch" : "Add Batch"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default BatchForm;