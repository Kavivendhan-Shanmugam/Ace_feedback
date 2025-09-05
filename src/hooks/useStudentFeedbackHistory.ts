"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
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
    
    const result = await apiClient.getFeedback();

    if (result.error) {
      console.error("Error fetching student feedback history:", result.error);
      showError("Failed to load your feedback history.");
      setFeedbackHistory([]);
      setTotalCount(0);
    } else {
      // Filter by student ID and implement client-side pagination
      const studentFeedback = (result.data || []).filter(f => f.student_id === userId);
      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      const paginatedFeedback = studentFeedback.slice(from, to);
      
      setFeedbackHistory(paginatedFeedback as FeedbackHistoryEntry[]);
      setTotalCount(studentFeedback.length);
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

    const result = await apiClient.updateFeedback(feedbackId, { is_response_seen_by_student: true });

    if (result.error) {
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