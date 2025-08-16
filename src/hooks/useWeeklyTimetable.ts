"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

    const { data, error } = await supabase
      .from('timetables')
      .select(`
        id,
        day_of_week,
        class_id,
        batch_id,
        semester_number,
        start_time,
        end_time,
        subjects!class_id (id, name, period)
      `)
      .eq('batch_id', studentBatchId)
      .eq('semester_number', studentSemesterNumber)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error("Error fetching timetable:", error);
      showError("Failed to load weekly timetable.");
    } else {
      // Explicitly filter out entries where 'subjects' is null
      setTimetableEntries((data || []).filter(entry => entry.subjects !== null));
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
      if (entry.subjects && groups[entry.day_of_week]) {
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