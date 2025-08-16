"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { showError } from '@/utils/toast';
import { FeedbackHistoryEntry } from '@/types/supabase';

export const useStudentFeedbackHistory = (page: number, pageSize: number) => {
  const { session, isLoading: isSessionLoading } = useSession();
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackHistoryEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFeedbackHistory = useCallback(async (userId: string) => {
    setLoading(true);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from('feedback')
      .select(`
        id,
        rating,
        comment,
        admin_response,
        created_at,
        is_response_seen_by_student,
        subjects(name, period)
      `, { count: 'exact' })
      .eq('student_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error("Error fetching student feedback history:", error);
      showError("Failed to load your feedback history.");
      setFeedbackHistory([]);
      setTotalCount(0);
    } else {
      setFeedbackHistory(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [page, pageSize]);

  useEffect(() => {
    if (!isSessionLoading && session?.user.id) {
      fetchFeedbackHistory(session.user.id);
    } else if (!isSessionLoading && !session) {
      setLoading(false);
    }
  }, [session, isSessionLoading, fetchFeedbackHistory]);

  const markAsSeen = async (feedbackId: string) => {
    // Optimistically update the UI for a responsive feel
    setFeedbackHistory(prev =>
      prev.map(f =>
        f.id === feedbackId ? { ...f, is_response_seen_by_student: true } : f
      )
    );

    const { error } = await supabase
      .from('feedback')
      .update({ is_response_seen_by_student: true })
      .eq('id', feedbackId);

    if (error) {
      // Revert the optimistic update if the database call fails
      setFeedbackHistory(prev =>
        prev.map(f =>
          f.id === feedbackId ? { ...f, is_response_seen_by_student: false } : f
        )
      );
      showError("Failed to mark feedback as seen.");
    }
  };

  const refetch = () => {
    if (session?.user.id) {
      fetchFeedbackHistory(session.user.id);
    }
  };

  return {
    feedbackHistory,
    loading,
    totalCount,
    refetch,
    markAsSeen,
  };
};