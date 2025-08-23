"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { showError } from '@/utils/toast';
import { Feedback } from '@/types/supabase';

export const useNotifications = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const [notifications, setNotifications] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        id,
        admin_response,
        created_at,
        is_response_seen_by_student,
        subjects:class_id(name)
      `)
      .eq('student_id', userId)
      .eq('is_response_seen_by_student', false)
      .not('admin_response', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      showError("Failed to load notifications.");
    } else {
      setNotifications(data as Feedback[] || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!isSessionLoading && session?.user.id) {
      fetchNotifications(session.user.id);

      const subscription = supabase
        .channel('public:feedback')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'feedback', filter: `student_id=eq.${session.user.id}` }, payload => {
          fetchNotifications(session.user.id);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [session, isSessionLoading, fetchNotifications]);

  const markAsRead = async (feedbackId: string) => {
    const { error } = await supabase
      .rpc('mark_feedback_as_seen', {
        feedback_id_to_update: feedbackId
      });

    if (error) {
      console.error("Error marking notification as read:", error);
      showError("Failed to mark notification as read.");
    } else {
      setNotifications(prev => prev.filter(n => n.id !== feedbackId));
    }
  };

  const markAllAsRead = async () => {
    if (!session?.user.id) return;
    const { error } = await supabase.rpc('mark_all_feedback_as_seen');

    if (error) {
      console.error("Error marking all notifications as read:", error);
      showError("Failed to mark all notifications as read.");
    } else {
      setNotifications([]);
    }
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
  };
};