"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { showError, showSuccess } from '@/utils/toast';
import { Subject, TimetableEntry } from '@/types/supabase';

export const useTimetable = () => {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Fetch subjects
    const subjectsResult = await apiClient.getSubjects();
    if (subjectsResult.error) {
      console.error("Error fetching subjects:", subjectsResult.error);
      showError("Failed to load subjects for timetable.");
    } else {
      setAvailableSubjects(subjectsResult.data || []);
    }

    // Fetch timetables
    const timetableResult = await apiClient.getTimetables();
    if (timetableResult.error) {
      console.error("Error fetching timetable entries:", timetableResult.error);
      showError("Failed to load timetable entries.");
    } else {
      setTimetableEntries(timetableResult.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTimetableEntry = async (values: { day_of_week: number; class_id: string; batch_id: string; semester_number: number; start_time: string; end_time: string }) => {
    setIsSubmitting(true);

    // Map values to match API expectations
    const timetableData = {
      dayOfWeek: values.day_of_week,
      classId: values.class_id,
      batchId: values.batch_id,
      semesterNumber: values.semester_number,
      startTime: values.start_time,
      endTime: values.end_time
    };

    const result = await apiClient.createTimetable(timetableData);

    if (result.error) {
      console.error("Error adding timetable entry:", result.error);
      showError(`Failed to add timetable entry: ${result.error}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Timetable entry added successfully!");
      await fetchData(); // Refetch to get the latest data
      setIsSubmitting(false);
      return result.data;
    }
  };

  const updateTimetableEntry = async (id: string, values: { day_of_week: number; class_id: string; batch_id: string; semester_number: number; start_time: string; end_time: string }) => {
    setIsSubmitting(true);

    // Map values to match API expectations
    const timetableData = {
      dayOfWeek: values.day_of_week,
      classId: values.class_id,
      batchId: values.batch_id,
      semesterNumber: values.semester_number,
      startTime: values.start_time,
      endTime: values.end_time
    };

    const result = await apiClient.updateTimetable(id, timetableData);

    if (result.error) {
      console.error("Error updating timetable entry:", result.error);
      showError(`Failed to update timetable entry: ${result.error}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Timetable entry updated successfully!");
      await fetchData(); // Refetch to get the latest data
      setIsSubmitting(false);
      return result.data;
    }
  };

  const deleteTimetableEntry = async (id: string) => {
    const result = await apiClient.deleteTimetable(id);

    if (result.error) {
      console.error("Error deleting timetable entry:", result.error);
      showError(`Failed to delete timetable entry: ${result.error}`);
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