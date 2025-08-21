"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Profile } from '@/types/supabase';

export const useStudentManager = () => {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_all_user_profiles');

    if (error) {
      console.error("Error fetching students:", error);
      showError("Failed to load students.");
    } else {
      const studentProfiles = (data || []).filter(profile => !profile.is_admin);
      setStudents(studentProfiles);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const addStudent = async (values: any) => {
    setIsSubmitting(true);
    const { data: invokeData, error: invokeError } = await supabase.functions.invoke('create-user', {
        body: values,
    });

    if (invokeError) {
        console.error("Error creating student:", invokeError);
        showError(`Failed to create student: ${invokeError.message}`);
        setIsSubmitting(false);
        return null;
    }

    const newUser = invokeData.user;

    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        batch_id: values.batch_id,
        semester_number: values.semester_number,
      })
      .eq('id', newUser.id);

    if (profileUpdateError) {
      console.error("Error updating student profile:", profileUpdateError);
      showError(`Student created, but failed to set batch/semester: ${profileUpdateError.message}`);
    }

    showSuccess("Student created successfully!");
    fetchStudents();
    setIsSubmitting(false);
    return newUser;
  };

  const updateStudent = async (id: string, values: any) => {
    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name,
        last_name: values.last_name,
        batch_id: values.batch_id,
        semester_number: values.semester_number,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating student:", error);
      showError(`Failed to update student: ${error.message}`);
      setIsSubmitting(false);
      return null;
    } else {
      showSuccess("Student updated successfully!");
      fetchStudents();
      setIsSubmitting(false);
      return data;
    }
  };

  const deleteStudent = async (id: string) => {
    const { error } = await supabase.functions.invoke('delete-user', {
      body: { user_id: id },
    });

    if (error) {
      console.error("Error deleting student:", error);
      showError(`Failed to delete student: ${error.message}`);
      return false;
    } else {
      showSuccess("Student deleted successfully!");
      fetchStudents();
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