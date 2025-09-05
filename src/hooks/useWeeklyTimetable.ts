"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';
import { showError } from '@/utils/toast';
import { TimetableEntry } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider';
import { useProfile } from './useProfile';

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

export const useWeeklyTimetable = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimetable = useCallback(async () => {
    setLoading(true);
    const userId = session?.user.id;
    const studentBatchId = profile?.batch_id;
    const studentSemesterNumber = profile?.semester_number;

    if (!userId || !studentBatchId || !studentSemesterNumber) {
      setLoading(false);
      setTimetableEntries([]);
      return;
    }

    // Get all timetables and filter client-side for now
    // TODO: Add batch/semester filtering to API if needed for performance
    const result = await apiClient.getTimetables();

    if (result.error) {
      console.error("Error fetching timetable:", result.error);
      showError("Failed to load weekly timetable.");
      setTimetableEntries([]);
    } else {
      // Filter by student's batch and semester
      const filteredEntries = (result.data || []).filter(entry => 
        entry.batch_id === studentBatchId && 
        entry.semester_number === studentSemesterNumber &&
        entry.subject_name // Ensure subject exists
      );
      setTimetableEntries(filteredEntries);
    }
    setLoading(false);
  }, [session?.user.id, profile?.batch_id, profile?.semester_number]);

  useEffect(() => {
    if (!isSessionLoading && !profileLoading && session) {
      fetchTimetable();
    } else if (!isSessionLoading && !session) {
      setLoading(false);
    }
  }, [session, isSessionLoading, profileLoading, fetchTimetable]);

  const groupedTimetable = useMemo(() => {
    const groups: { [key: number]: TimetableEntry[] } = {};
    daysOfWeek.forEach(day => (groups[day.value] = []));
    timetableEntries.forEach(entry => {
      if ((entry.subject_name || entry.subjects) && groups[entry.day_of_week]) {
        groups[entry.day_of_week].push(entry);
      }
    });
    // Sort classes within each day by start time
    Object.values(groups).forEach(dayEntries => {
      dayEntries.sort((a, b) => a.start_time.localeCompare(b.start_time));
    });
    return groups;
  }, [timetableEntries]);

  return {
    groupedTimetable,
    loading,
    daysOfWeek,
  };
};