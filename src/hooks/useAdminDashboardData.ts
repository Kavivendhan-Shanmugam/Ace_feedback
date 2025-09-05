"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { showError } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider';

// Define types for the data we expect
interface Feedback {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  student_id: string;
  class_id: string;
  batch_id: string;
  semester_number: number;
  admin_response: string | null;
  subject_name: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
}

interface SubjectPerformanceSummary {
  subject_id: string;
  subject_name: string;
  average_rating: number;
  feedback_count: number;
}

export const useAdminDashboardData = () => {
  const { isAdmin, isLoading: isSessionLoading } = useSession();
  const [recentFeedback, setRecentFeedback] = useState<Feedback[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformanceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isAdmin) {
      setRecentFeedback([]);
      setSubjectPerformance([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [subjectStatsRes, recentFeedbackRes] = await Promise.all([
        apiClient.getSubjectStats(),
        apiClient.getRecentFeedback()
      ]);

      if (subjectStatsRes.error || recentFeedbackRes.error) {
        console.error("Error fetching dashboard data:", subjectStatsRes.error || recentFeedbackRes.error);
        showError("Failed to load dashboard data.");
        setRecentFeedback([]);
        setSubjectPerformance([]);
      } else {
        const subjectStats = subjectStatsRes.data || [];
        const performanceSummary: SubjectPerformanceSummary[] = subjectStats.map((stat: any) => ({
          subject_id: stat.subject_id,
          subject_name: stat.subject_name,
          average_rating: Number(stat.average_rating),
          feedback_count: Number(stat.feedback_count)
        }));
        setSubjectPerformance(performanceSummary);
        setRecentFeedback(recentFeedbackRes.data || []);
      }

    } catch (error: any) {
      console.error('Dashboard data error:', error);
      showError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchData();
    }
  }, [fetchData, isSessionLoading]);

  const topSubjects = [...subjectPerformance].sort((a, b) => b.average_rating - a.average_rating).slice(0, 3);
  const bottomSubjects = [...subjectPerformance].sort((a, b) => a.average_rating - b.average_rating).slice(0, 3);

  return {
    recentFeedback,
    topSubjects,
    bottomSubjects,
    loading,
    fetchData,
  };
};