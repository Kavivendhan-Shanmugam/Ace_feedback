"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { useProfile } from './useProfile';
import { showError } from '@/utils/toast';
import { FeedbackQuestion } from '@/types/supabase';

export const useStudentFeedbackQuestions = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const { profile, loading: isProfileLoading } = useProfile();
  const [questions, setQuestions] = useState<FeedbackQuestion[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuestions = useCallback(async () => {
    // TODO: Implement MySQL feedback questions API
    // For now, return empty questions to avoid Supabase errors
    setLoading(false);
    setQuestions([]);
  }, []);

  useEffect(() => {
    if (!isSessionLoading && !isProfileLoading) {
      fetchQuestions();
    }
  }, [isSessionLoading, isProfileLoading, fetchQuestions]);

  return { questions, loading };
};