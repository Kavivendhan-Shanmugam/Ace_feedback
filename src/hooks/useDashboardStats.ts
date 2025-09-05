"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { showError } from '@/utils/toast';

interface DashboardStatsData {
  studentCount: number;
  subjectCount: number;
  totalFeedbackCount: number;
  feedbackTodayCount: number;
}

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.getDashboardStats();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        setStats({
          studentCount: response.data.studentCount || 0,
          subjectCount: response.data.subjectCount || 0,
          totalFeedbackCount: response.data.totalFeedbackCount || 0,
          feedbackTodayCount: response.data.feedbackTodayCount || 0,
        });
      }

    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      showError(error.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, fetchStats };
};