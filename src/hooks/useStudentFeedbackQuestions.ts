"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useProfile } from './useProfile';
import { FeedbackQuestion } from '@/types/supabase';

export const useStudentFeedbackQuestions = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = useCallback(async () => {
    if (!session || !profile?.batch_id || !profile?.semester_number) {
      setQuestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback_questions')
      .select('*')
      .eq('batch_id', profile.batch_id)
      .eq('semester_number', profile.semester_number);

    if (error) {
      console.error("Error fetching feedback questions for student:", error);
      setQuestions([]);
    } else {
      setQuestions(data || []);
    }
    setLoading(false);
  }, [session, profile]);

  useEffect(() => {
    if (!isSessionLoading && !profileLoading) {
      fetchQuestions();
    }
  }, [isSessionLoading, profileLoading, fetchQuestions]);

  return { questions, loading };
};