"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Feedback } from '@/types/supabase';

export const useFeedbackManager = () => {
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        admin_response,
        created_at,
        is_response_seen_by_student,
        class_id,
        subjects(name, period),
        profiles(first_name, last_name),
        batches(name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching feedback:", error);
      showError("Failed to load feedback entries.");
    } else {
      setFeedbackEntries(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeedback();

    const channel = supabase
      .channel('feedback-manager-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback' },
        () => fetchFeedback()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFeedback]);

  const updateAdminResponse = async (feedbackId: string, response: string | null) => {
    setIsSubmittingResponse(true);
    const { data, error } = await supabase
      .from('feedback')
      .update({ 
        admin_response: response,
        is_response_seen_by_student: false // Reset flag to notify student
      })
      .eq('id', feedbackId)
      .select()
      .single();

    if (error) {
      console.error("Error updating feedback response:", error);
      showError("Failed to update feedback response.");
      setIsSubmittingResponse(false);
      return null;
    } else {
      showSuccess("Feedback response updated successfully!");
      // No need to manually refetch, real-time subscription will handle it.
      setIsSubmittingResponse(false);
      return data;
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', feedbackId);

    if (error) {
      console.error("Error deleting feedback:", error);
      showError("Failed to delete feedback entry.");
      return false;
    } else {
      showSuccess("Feedback entry deleted successfully!");
      // No need to manually refetch, real-time subscription will handle it.
      return true;
    }
  };

  return {
    feedbackEntries,
    loading,
    isSubmittingResponse,
    fetchFeedback,
    updateAdminResponse,
    deleteFeedback,
  };
};