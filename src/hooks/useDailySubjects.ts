"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { showError } from '@/utils/toast';
import { DailySubject } from '@/types/supabase';
import { useProfile } from './useProfile';

const FEEDBACK_GRACE_PERIOD_MINUTES = 15;

export const useDailySubjects = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const [dailySubjects, setDailySubjects] = useState<DailySubject[]>([]);
  const [activeFeedbackSubject, setActiveFeedbackSubject] = useState<DailySubject | null>(null);
  const [hasSubmittedFeedbackForActiveSubject, setHasSubmittedFeedbackForActiveSubject] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkFeedbackWindow = useCallback((subjectItem: DailySubject) => {
    const now = new Date();
    const [startHour, startMinute] = subjectItem.start_time.split(':').map(Number);
    const [endHour, endMinute] = subjectItem.end_time.split(':').map(Number);

    const subjectStartTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, startMinute);
    const subjectEndTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endHour, endMinute);

    const feedbackWindowEndTime = new Date(subjectEndTime.getTime() + FEEDBACK_GRACE_PERIOD_MINUTES * 60 * 1000);

    return now >= subjectStartTime && now <= feedbackWindowEndTime;
  }, []);

  const fetchDailySubjects = useCallback(async () => {
    setLoading(true);
    
    // TODO: Implement MySQL timetables and daily subjects API
    // For now, return empty data to avoid Supabase errors
    setDailySubjects([]);
    setActiveFeedbackSubject(null);
    setHasSubmittedFeedbackForActiveSubject(false);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSessionLoading && !profileLoading && session) {
      fetchDailySubjects();
      const interval = setInterval(fetchDailySubjects, 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [session, isSessionLoading, profileLoading, fetchDailySubjects]);

  return {
    dailySubjects,
    activeFeedbackSubject,
    hasSubmittedFeedbackForActiveSubject,
    loading,
    fetchDailySubjects
  };
};