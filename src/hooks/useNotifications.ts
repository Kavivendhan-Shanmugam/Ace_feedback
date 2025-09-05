"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { showError } from '@/utils/toast';
import { Feedback } from '@/types/supabase';

export const useNotifications = () => {
  const { session, isLoading: isSessionLoading } = useSession();
  const [notifications, setNotifications] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(false); // Set to false to avoid loading state

  const fetchNotifications = useCallback(async (userId: string) => {
    // TODO: Implement MySQL notifications API
    // For now, return empty notifications to avoid Supabase errors
    setLoading(false);
    setNotifications([]);
  }, []);

  useEffect(() => {
    if (!isSessionLoading && session?.user.id) {
      // Temporarily disabled to avoid Supabase calls
      setNotifications([]);
      setLoading(false);
    }
  }, [session, isSessionLoading, fetchNotifications]);

  const markAsRead = async (feedbackId: string) => {
    // TODO: Implement MySQL mark as read API
    setNotifications(prev => prev.filter(n => n.id !== feedbackId));
  };

  const markAllAsRead = async () => {
    // TODO: Implement MySQL mark all as read API
    setNotifications([]);
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
  };
};