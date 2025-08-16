"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Feedback, SubjectPerformanceSummary, SubjectFeedbackStats } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider';

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
        supabase.rpc('get_subject_feedback_stats'),
        supabase.from('feedback').select(`*, subjects (name), profiles (first_name, last_name, avatar_url)`).order('created_at', { ascending: false }).limit(5)
      ]);

      if (subjectStatsRes.error || recentFeedbackRes.error) {
        console.error("Error fetching dashboard data:", subjectStatsRes.error || recentFeedbackRes.error);
        if (subjectStatsRes.error?.code !== '42501' && recentFeedbackRes.error?.code !== '42501') {
          showError("Failed to load dashboard data.");
        }
        setRecentFeedback([]);
        setSubjectPerformance([]);
      } else {
        const subjectStats: SubjectFeedbackStats[] = subjectStatsRes.data || [];
        const performanceSummary: SubjectPerformanceSummary[] = subjectStats.map(stat => ({
          subject_id: stat.subject_id,
          subject_name: stat.subject_name,
          average_rating: stat.average_rating,
          feedback_count: Number(stat.feedback_count) // Convert bigint to number
        }));
        setSubjectPerformance(performanceSummary);
        setRecentFeedback(recentFeedbackRes.data || []);
      }

    } catch (error: any) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isSessionLoading) {
      fetchData();

      const channel = supabase
        .channel('admin-dashboard-feedback-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'feedback' },
          () => fetchData()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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