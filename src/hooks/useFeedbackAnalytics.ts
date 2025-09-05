"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { showError } from '@/utils/toast';
import { SubjectFeedbackStats } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider';

export const useFeedbackAnalytics = (batchId?: string | null, semesterNumber?: number | null) => { // Added batchId and semesterNumber
  const { isAdmin, isLoading: isSessionLoading } = useSession();
  const [feedbackStats, setFeedbackStats] = useState<SubjectFeedbackStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedbackStats = useCallback(async () => {
    if (!isAdmin) {
      setFeedbackStats([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await apiClient.getFeedbackAnalytics(
      batchId || undefined,
      semesterNumber || undefined
    );

    if (result.error) {
      console.error("Error fetching feedback for analytics:", result.error);
      showError("Failed to load feedback analytics.");
      setFeedbackStats([]);
    } else {
      setFeedbackStats(result.data || []);
    }
    setLoading(false);
  }, [isAdmin, batchId, semesterNumber]); // Add batchId and semesterNumber to dependencies

  useEffect(() => {
    if (!isSessionLoading) {
      fetchFeedbackStats();
    }
  }, [fetchFeedbackStats, isSessionLoading, batchId, semesterNumber]);

  return {
    feedbackStats,
    loading,
    fetchFeedbackStats,
  };
};