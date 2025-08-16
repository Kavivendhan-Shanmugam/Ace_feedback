"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { useBatches } from '@/hooks/useBatches';
import { Batch } from '@/types/supabase';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(1, "Batch name is required"),
});
type BatchFormValues = z.infer<typeof formSchema>;

const BatchForm: React.FC<{
  initialData?: BatchFormValues;
  onSubmit: (data: BatchFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}> = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || { name: "" },
  });

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
                <Input placeholder="e.g., 2021-2025 CSE" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
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

const BatchManager: React.FC = () => {
  const { batches, loading, isSubmitting, addBatch, updateBatch, deleteBatch } = useBatches();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);

  const handleAddBatch = async (values: BatchFormValues) => {
    const newBatch = await addBatch(values);
    if (newBatch) {
      setIsFormOpen(false);
    }
  };

  const handleUpdateBatch = async (values: BatchFormValues) => {
    if (!editingBatch) return;
    const updatedBatch = await updateBatch(editingBatch.id, values);
    if (updatedBatch) {
      setIsFormOpen(false);
      setEditingBatch(null);
    }
  };

  const handleDeleteBatch = async (id: string) => {
    await deleteBatch(id);
  };

  const openEditForm = (batch: Batch) => {
    setEditingBatch(batch);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingBatch(null);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Manage Batches</CardTitle>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingBatch(null); setIsFormOpen(true); }}>Add New Batch</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingBatch ? "Edit Batch" : "Add New Batch"}</DialogTitle>
            </DialogHeader>
            {isFormOpen && (
              <BatchForm
                initialData={editingBatch ? { name: editingBatch.name } : undefined}
                onSubmit={editingBatch ? handleUpdateBatch : handleAddBatch}
                onCancel={closeForm}
                isSubmitting={isSubmitting}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-6 w-48" /></TableCell>
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
        ) : batches.length === 0 ? (
          <p className="text-center py-8">No batches added yet. Click "Add New Batch" to get started.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch: Batch) => (
                <TableRow key={batch.id}>
                  <TableCell>{batch.name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => openEditForm(batch)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit Batch</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ConfirmAlertDialog
                            title="Are you absolutely sure?"
                            description="This action cannot be undone. This will permanently delete the batch and may affect associated subjects, timetables, and user profiles."
                            onConfirm={() => handleDeleteBatch(batch.id)}
                          >
                            <Button variant="destructive" size="icon">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </ConfirmAlertDialog>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete Batch</p>
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

export default BatchManager;