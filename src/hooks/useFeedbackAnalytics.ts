"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    const { data, error } = await supabase.rpc('get_subject_feedback_stats', {
      p_batch_id: batchId, // Pass batchId
      p_semester_number: semesterNumber, // Pass semesterNumber
    });

    if (error) {
      console.error("Error fetching feedback for analytics:", error);
      if (error?.code !== '42501') {
        showError("Failed to load feedback analytics.");
      }
      setFeedbackStats([]);
    } else {
      setFeedbackStats(data || []);
    }
    setLoading(false);
  }, [isAdmin, batchId, semesterNumber]); // Add batchId and semesterNumber to dependencies

  useEffect(() => {
    if (!isSessionLoading) {
      fetchFeedbackStats();

      const channel = supabase
        .channel(`feedback-analytics-changes-${batchId || 'no-batch'}-${semesterNumber || 'no-semester'}`) // Unique channel name
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'feedback' },
          () => fetchFeedbackStats()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [fetchFeedbackStats, isSessionLoading, batchId, semesterNumber]); // Add batchId and semesterNumber to dependencies

  return {
    feedbackStats,
    loading,
    fetchFeedbackStats,
  };
};