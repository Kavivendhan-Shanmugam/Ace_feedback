"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { showError, showSuccess } from '@/utils/toast';
import { Batch } from '@/types/supabase';

export const useBatches = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBatches = useCallback(async () => {
    setLoading(true);
    const result = await apiClient.getBatches();

    if (result.error) {
      console.error("Error fetching batches:", result.error);
      showError("Failed to load batches.");
    } else {
      setBatches(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const addBatch = async (values: Omit<Batch, 'id' | 'created_at'>) => {
    setIsSubmitting(true);
    console.log('Adding batch with values:', values);
    
    const result = await apiClient.createBatch(values.name);

    if (result.error) {
      console.error("Error adding batch:", result.error);
      showError(`Failed to add batch: ${result.error}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Batch added successfully!");
      // Refresh the entire list instead of just adding to the current list
      await fetchBatches();
      setIsSubmitting(false);
      return result.data;
    }
  };

  const updateBatch = async (id: string, values: Omit<Batch, 'id' | 'created_at'>) => {
    setIsSubmitting(true);
    
    const result = await apiClient.updateBatch(id, values.name);

    if (result.error) {
      console.error("Error updating batch:", result.error);
      showError(`Failed to update batch: ${result.error}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Batch updated successfully!");
      setBatches(prevBatches => prevBatches.map(batch => batch.id === result.data.id ? result.data : batch).sort((a, b) => a.name.localeCompare(b.name)));
      setIsSubmitting(false);
      return result.data;
    }
  };

  const deleteBatch = async (id: string) => {
    // Note: Deleting a batch will cascade delete subjects, timetables, and set profiles to NULL.
    // Consider if you need a more complex deletion logic (e.g., reassigning subjects/timetables).
    const result = await apiClient.deleteBatch(id);

    if (result.error) {
      console.error("Error deleting batch:", result.error);
      showError(`Failed to delete batch: ${result.error}`);
      return false;
    } else {
      showSuccess("Batch deleted successfully!");
      setBatches(prevBatches => prevBatches.filter(batch => batch.id !== id));
      return true;
    }
  };

  return {
    batches,
    loading,
    isSubmitting,
    addBatch,
    updateBatch,
    deleteBatch,
    fetchBatches
  };
};