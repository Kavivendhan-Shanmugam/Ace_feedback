"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Subject } from '@/types/supabase'; // Import Subject

export const useSubjects = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSubjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('subjects')
      .select(`*, batches!subjects_batch_id_fkey(name)`) // Join with batches to get batch name
      .order('name', { ascending: true });

    if (error) {
      console.error("Error fetching subjects:", error);
      showError("Failed to load subjects.");
    } else {
      setSubjects(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const addSubject = async (values: Omit<Subject, 'id' | 'created_at' | 'batches'>) => {
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('subjects')
      .insert(values)
      .select(`*, batches!subjects_batch_id_fkey(name)`)
      .single();

    if (error) {
      console.error("Error adding subject:", error);
      showError("Failed to add subject.");
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Subject added successfully!");
      setSubjects(prevSubjects => [...prevSubjects, data].sort((a, b) => a.name.localeCompare(b.name)));
      setIsSubmitting(false);
      return data;
    }
  };

  const updateSubject = async (id: string, values: Omit<Subject, 'id' | 'created_at' | 'batches'>) => {
    setIsSubmitting(true);
    
    const { data, error } = await supabase
      .from('subjects')
      .update(values)
      .eq('id', id)
      .select(`*, batches!subjects_batch_id_fkey(name)`)
      .single();

    if (error) {
      console.error("Error updating subject:", error);
      showError("Failed to update subject.");
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Subject updated successfully!");
      setSubjects(prevSubjects => prevSubjects.map(sub => sub.id === data.id ? data : sub).sort((a, b) => a.name.localeCompare(b.name)));
      setIsSubmitting(false);
      return data;
    }
  };

  const deleteSubject = async (id: string) => {
    const { error } = await supabase
      .rpc('delete_subject_and_dependents', { // Renamed RPC call
        subject_id_to_delete: id
      });

    if (error) {
      console.error("Error deleting subject:", error);
      showError(`Failed to delete subject: ${error.message}`);
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