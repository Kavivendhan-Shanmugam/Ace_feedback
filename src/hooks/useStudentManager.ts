"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { showError, showSuccess } from '@/utils/toast';
import { Profile } from '@/types/supabase';

export const useStudentManager = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const result = await apiClient.getStudents();

    if (result.error) {
      console.error("Error fetching students:", result.error);
      showError("Failed to load students.");
    } else {
      setStudents(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = async (values: any) => {
    setIsSubmitting(true);
    console.log('Adding student with values:', values);
    
    // Map form values to API expected format
    const studentData = {
      email: values.email,
      password: values.password || 'defaultPassword123', // You might want to generate this
      firstName: values.first_name,
      lastName: values.last_name,
      batchId: values.batch_id,
      semesterNumber: values.semester_number
    };
    
    const result = await apiClient.createStudent(studentData);

    if (result.error) {
      console.error("Error creating student:", result.error);
      showError(`Failed to create student: ${result.error}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Student created successfully!");
      await fetchStudents();
      setIsSubmitting(false);
      return result.data;
    }
  };

  const updateStudent = async (id: string, values: any) => {
    setIsSubmitting(true);
    
    // Map form values to API expected format
    const updateData = {
      firstName: values.first_name,
      lastName: values.last_name,
      batchId: values.batch_id,
      semesterNumber: values.semester_number
    };
    
    const result = await apiClient.updateStudent(id, updateData);

    if (result.error) {
      console.error("Error updating student:", result.error);
      showError(`Failed to update student: ${result.error}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Student updated successfully!");
      await fetchStudents();
      setIsSubmitting(false);
      return result.data;
    }
  };

  const deleteStudent = async (id: string) => {
    const result = await apiClient.deleteStudent(id);

    if (result.error) {
      console.error("Error deleting student:", result.error);
      showError(`Failed to delete student: ${result.error}`);
      return false;
    } else {
      showSuccess("Student deleted successfully!");
      await fetchStudents();
      return true;
    }
  };

  return {
    students,
    loading,
    isSubmitting,
    addStudent,
    updateStudent,
    deleteStudent,
    fetchStudents,
  };
};