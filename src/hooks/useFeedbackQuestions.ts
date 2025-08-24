"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { FeedbackQuestion } from '@/types/supabase';

export const useFeedbackQuestions = () => {
  const [feedbackQuestions, setFeedbackQuestions] = useState<FeedbackQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchFeedbackQuestions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback_questions')
      .select(`*, batches(name)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching feedback questions:", error);
      showError("Failed to load feedback questions.");
    } else {
      setFeedbackQuestions(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeedbackQuestions();

    const channel = supabase
      .channel('feedback-questions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'feedback_questions' },
        () => fetchFeedbackQuestions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchFeedbackQuestions]);

  const addFeedbackQuestion = async (values: Omit<FeedbackQuestion, 'id' | 'created_at' | 'batches'>) => {
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('feedback_questions')
      .insert(values)
      .select(`*, batches(name)`)
      .single();

    if (error) {
      console.error("Error adding feedback question:", error);
      showError(`Failed to add question: ${error.message}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Feedback question added successfully!");
      setFeedbackQuestions(prevQuestions => [data, ...prevQuestions]);
      setIsSubmitting(false);
      return data;
    }
  };

  const updateFeedbackQuestion = async (id: string, values: Omit<FeedbackQuestion, 'id' | 'created_at' | 'batches'>) => {
    setIsSubmitting(true);
    
    const { data, error } = await supabase
      .from('feedback_questions')
      .update(values)
      .eq('id', id)
      .select(`*, batches(name)`)
      .single();

    if (error) {
      console.error("Error updating feedback question:", error);
      showError(`Failed to update question: ${error.message}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Feedback question updated successfully!");
      setFeedbackQuestions(prevQuestions => prevQuestions.map(q => q.id === data.id ? data : q));
      setIsSubmitting(false);
      return data;
    }
  };

  const deleteFeedbackQuestion = async (id: string) => {
    const { error } = await supabase
      .from('feedback_questions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting feedback question:", error);
      showError(`Failed to delete question: ${error.message}`);
      return false;
    } else {
      showSuccess("Feedback question deleted successfully!");
      setFeedbackQuestions(prevQuestions => prevQuestions.filter(q => q.id !== id));
      return true;
    }
  };

  return {
    feedbackQuestions,
    loading,
    isSubmitting,
    addFeedbackQuestion,
    updateFeedbackQuestion,
    deleteFeedbackQuestion,
    fetchFeedbackQuestions
  };
};