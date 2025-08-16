"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
    const userId = session?.user.id;
    const studentBatchId = profile?.batch_id;
    const studentSemesterNumber = profile?.semester_number;

    if (!userId || !studentBatchId || !studentSemesterNumber) {
      setLoading(false);
      setActiveFeedbackSubject(null);
      setHasSubmittedFeedbackForActiveSubject(false);
      setDailySubjects([]);
      return;
    }

    const currentDayOfWeek = new Date().getDay();
    const supabaseDayOfWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek;

    const { data: timetableEntries, error: timetableError } = await supabase
      .from('timetables')
      .select(`
        class_id,
        start_time,
        end_time,
        subjects(id, name, period)
      `)
      .eq('day_of_week', supabaseDayOfWeek)
      .eq('batch_id', studentBatchId)
      .eq('semester_number', studentSemesterNumber)
      .order('start_time', { ascending: true });

    if (timetableError) {
      console.error("Error fetching daily timetable entries:", timetableError);
      showError("Failed to load daily timetable.");
      setLoading(false);
      return;
    }

    const dailyScheduledSubjects: DailySubject[] = (timetableEntries || [])
      .filter(entry => entry.subjects)
      .map(entry => ({
        id: entry.subjects!.id,
        name: entry.subjects!.name,
        start_time: entry.start_time,
        end_time: entry.end_time,
        batch_id: studentBatchId,
        semester_number: studentSemesterNumber,
      }));

    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select('class_id')
      .eq('student_id', userId)
      .eq('batch_id', studentBatchId)
      .eq('semester_number', studentSemesterNumber);

    if (feedbackError) {
      console.error("Error fetching student feedback:", feedbackError);
      showError("Failed to load feedback status.");
    }

    const submittedSubjectIds = new Set(feedbackData?.map(f => f.class_id));

    const subjectsWithFeedbackStatus = dailyScheduledSubjects.map(sub => ({
      ...sub,
      hasSubmittedFeedback: submittedSubjectIds.has(sub.id),
    }));

    setDailySubjects(subjectsWithFeedbackStatus);

    const currentActive = subjectsWithFeedbackStatus.find(checkFeedbackWindow);
    setActiveFeedbackSubject(currentActive || null);

    if (currentActive) {
      setHasSubmittedFeedbackForActiveSubject(currentActive.hasSubmittedFeedback || false);
    } else {
      setHasSubmittedFeedbackForActiveSubject(false);
    }

    setLoading(false);
  }, [session?.user.id, profile?.batch_id, profile?.semester_number, checkFeedbackWindow]);

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