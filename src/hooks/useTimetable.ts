"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Subject, TimetableEntry } from '@/types/supabase';

export const useTimetable = () => {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: subjectsData, error: subjectsError } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });

    if (subjectsError) {
      console.error("Error fetching subjects:", subjectsError);
      showError("Failed to load subjects for timetable.");
    } else {
      setAvailableSubjects(subjectsData || []);
    }

    const { data: timetableData, error: timetableError } = await supabase
      .from('timetables')
      .select(`
        id,
        day_of_week,
        class_id,
        batch_id,
        semester_number,
        start_time,
        end_time,
        subjects!class_id (id, name, period),
        batches!batch_id (name)
      `)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (timetableError) {
      console.error("Error fetching timetable entries:", timetableError);
      showError("Failed to load timetable entries.");
    } else {
      // Explicitly filter out entries where 'subjects' is null
      setTimetableEntries((timetableData || []).filter(entry => entry.subjects !== null));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTimetableEntry = async (values: { day_of_week: number; class_id: string; batch_id: string; semester_number: number; start_time: string; end_time: string }) => {
    setIsSubmitting(true);

    const { data: dayEntries, error: dayEntriesError } = await supabase
      .from('timetables')
      .select('start_time, end_time')
      .eq('day_of_week', values.day_of_week)
      .eq('batch_id', values.batch_id)
      .eq('semester_number', values.semester_number);

    if (dayEntriesError) {
      console.error("Error fetching day's schedule for conflict check:", dayEntriesError);
      showError("Could not verify timetable for conflicts.");
      setIsSubmitting(false);
      return null;
    }

    const hasConflict = dayEntries.some(existingEntry => {
      return values.start_time < existingEntry.end_time && values.end_time > existingEntry.start_time;
    });

    if (hasConflict) {
      showError(`Time conflict detected. A subject is already scheduled during this time for this batch and semester.`);
      setIsSubmitting(false);
      return null;
    }

    const { data, error } = await supabase
      .from('timetables')
      .insert(values)
      .select(`
        id,
        day_of_week,
        class_id,
        batch_id,
        semester_number,
        start_time,
        end_time,
        subjects!class_id (id, name, period),
        batches!batch_id (name)
      `)
      .single();

    if (error) {
      console.error("Error adding timetable entry:", error);
      showError("Failed to add timetable entry.");
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Timetable entry added successfully!");
      setTimetableEntries(prevEntries => [...prevEntries, data]);
      fetchData(); // Refetch to ensure sorted order
      setIsSubmitting(false);
      return data;
    }
  };

  const updateTimetableEntry = async (id: string, values: { day_of_week: number; class_id: string; batch_id: string; semester_number: number; start_time: string; end_time: string }) => {
    setIsSubmitting(true);

    const { data: dayEntries, error: dayEntriesError } = await supabase
      .from('timetables')
      .select('start_time, end_time')
      .eq('day_of_week', values.day_of_week)
      .eq('batch_id', values.batch_id)
      .eq('semester_number', values.semester_number)
      .not('id', 'eq', id);

    if (dayEntriesError) {
      console.error("Error fetching day's schedule for conflict check:", dayEntriesError);
      showError("Could not verify timetable for conflicts.");
      setIsSubmitting(false);
      return null;
    }

    const hasConflict = dayEntries.some(existingEntry => {
      return values.start_time < existingEntry.end_time && values.end_time > existingEntry.start_time;
    });

    if (hasConflict) {
      showError(`Time conflict detected. A subject is already scheduled during this time for this batch and semester.`);
      setIsSubmitting(false);
      return null;
    }

    const { data, error } = await supabase
      .from('timetables')
      .update(values)
      .eq('id', id)
      .select(`
        id,
        day_of_week,
        class_id,
        batch_id,
        semester_number,
        start_time,
        end_time,
        subjects!class_id (id, name, period),
        batches!batch_id (name)
      `)
      .single();

    if (error) {
      console.error("Error updating timetable entry:", error);
      showError("Failed to update timetable entry.");
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Timetable entry updated successfully!");
      fetchData(); // Refetch to ensure sorted order
      setIsSubmitting(false);
      return data;
    }
  };

  const deleteTimetableEntry = async (id: string) => {
    const { error } = await supabase
      .from('timetables')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting timetable entry:", error);
      showError("Failed to delete timetable entry.");
      return false;
    } else {
      showSuccess("Timetable entry deleted successfully!");
      setTimetableEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
      return true;
    }
  };

  return {
    timetableEntries,
    availableSubjects,
    loading,
    isSubmitting,
    addTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    fetchData,
  };
};