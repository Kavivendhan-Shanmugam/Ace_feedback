"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { showError } from '@/utils/toast';
import { Feedback } from '@/types/supabase';

export const useAdminNotifications = () => {
  const { session, isLoading: isSessionLoading, isAdmin } = useSession();
  const [notifications, setNotifications] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAdmin) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        id,
        created_at,
        comment,
        subjects (name),
        profiles:student_id (first_name, last_name)
      `)
      .is('admin_response', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching admin notifications:", error);
      showError("Failed to load new feedback notifications.");
    } else {
      setNotifications(data || []);
    }
    setLoading(false);
  }, [isAdmin]);

  useEffect(() => {
    if (!isSessionLoading && session) {
      fetchNotifications();

      const subscription = supabase
        .channel('public:feedback:admin')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback' }, payload => {
          // Refetch on any change to the feedback table
          fetchNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [session, isSessionLoading, fetchNotifications]);

  return {
    notifications,
    loading,
  };
};