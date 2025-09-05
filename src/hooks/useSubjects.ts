"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { showError, showSuccess } from '@/utils/toast';
import { Subject } from '@/types/supabase'; // Import Subject

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    const result = await apiClient.getSubjects();

    if (result.error) {
      console.error("Error fetching subjects:", result.error);
      showError("Failed to load subjects.");
    } else {
      setSubjects(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const addSubject = async (values: Omit<Subject, 'id' | 'created_at' | 'batches'>) => {
    setIsSubmitting(true);
    console.log('Adding subject with values:', values);
    
    // Map the form data to match API expectations
    const subjectData = {
      name: values.name,
      period: values.period || null,
      batchId: values.batch_id,
      semesterNumber: values.semester_number
    };
    
    const result = await apiClient.createSubject(subjectData);

    if (result.error) {
      console.error("Error adding subject:", result.error);
      showError(`Failed to add subject: ${result.error}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Subject added successfully!");
      // Refresh the entire list instead of just adding to the current list
      await fetchSubjects();
      setIsSubmitting(false);
      return result.data;
    }
  };

  const updateSubject = async (id: string, values: Omit<Subject, 'id' | 'created_at' | 'batches'>) => {
    setIsSubmitting(true);
    
    // Map the form data to match API expectations
    const subjectData = {
      name: values.name,
      period: values.period || null,
      batchId: values.batch_id,
      semesterNumber: values.semester_number
    };
    
    const result = await apiClient.updateSubject(id, subjectData);

    if (result.error) {
      console.error("Error updating subject:", result.error);
      showError(`Failed to update subject: ${result.error}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Subject updated successfully!");
      setSubjects(prevSubjects => prevSubjects.map(sub => sub.id === result.data.id ? result.data : sub).sort((a, b) => a.name.localeCompare(b.name)));
      setIsSubmitting(false);
      return result.data;
    }
  };

  const deleteSubject = async (id: string) => {
    const result = await apiClient.deleteSubject(id);

    if (result.error) {
      console.error("Error deleting subject:", result.error);
      showError(`Failed to delete subject: ${result.error}`);
      return false;
    } else {
      showSuccess("Subject deleted successfully!");
      setSubjects(prevSubjects => prevSubjects.filter(sub => sub.id !== id));
      return true;
    }
  };

  return {
    subjects,
    loading,
    isSubmitting,
    addSubject,
    updateSubject,
    deleteSubject,
    fetchSubjects
  };
};