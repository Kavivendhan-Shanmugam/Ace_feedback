"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { showError } from '@/utils/toast';
import { FeedbackTrendPoint } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider';

export const useFeedbackTrends = (timeframeInDays: number = 30, batchId?: string | null, semesterNumber?: number | null) => { // Added batchId and semesterNumber
  const { isAdmin, isLoading: isSessionLoading } = useSession(); // Get isAdmin and session loading state
  const [trendData, setTrendData] = useState<FeedbackTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrends = useCallback(async () => {
    if (!isAdmin) {
      setTrendData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    
    const result = await apiClient.getFeedbackTrends(
      timeframeInDays,
      batchId || undefined,
      semesterNumber || undefined
    );

    if (result.error) {
      console.error("Error fetching feedback trends:", result.error);
      showError("Failed to load feedback trends.");
      setTrendData([]);
    } else {
      // Format the data to match expected structure
      const formattedData = (result.data || []).map((d: any) => ({
        ...d,
        date: d.date instanceof Date ? d.date.toISOString().split('T')[0] : d.date
      }));
      setTrendData(formattedData);
    }
    setLoading(false);
  }, [timeframeInDays, isAdmin, batchId, semesterNumber]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchTrends();
    }
  }, [fetchTrends, timeframeInDays, isSessionLoading, batchId, semesterNumber]);

  return { trendData, loading, fetchTrends };
};