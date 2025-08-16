"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import { Profile } from '@/types/supabase'; // Import Profile

export const useUserManager = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    // Fetch from the new secure function, including batch and semester
    const { data, error } = await supabase
      .rpc('get_all_user_profiles');

    if (error) {
      console.error("Error fetching users:", error);
      showError("Failed to load user list. You may not have admin privileges.");
    } else {
      // Fetch batch names separately if needed, or modify RPC to join
      // For now, assuming RPC returns batch_id and semester_number
      setUsers(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleAdminStatus = async (userId: string, currentIsAdmin: boolean) => {
    setUpdatingUserId(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ is_admin: !currentIsAdmin })
      .eq('id', userId);

    if (error) {
      console.error("Error updating admin status:", error);
      showError(`Failed to update admin status for user ${userId}.`);
    } else {
      showSuccess("Admin status updated successfully!");
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, is_admin: !currentIsAdmin } : user
        )
      );
    }
    setUpdatingUserId(null);
  };

  const updateUser = async (userId: string, values: { first_name?: string; last_name?: string; is_admin?: boolean; batch_id?: string | null; semester_number?: number | null }) => { // Added batch_id, semester_number
    setUpdatingUserId(userId);
    const { data, error } = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name || null,
        last_name: values.last_name || null,
        is_admin: values.is_admin,
        batch_id: values.batch_id || null, // Update batch_id
        semester_number: values.semester_number || null, // Update semester_number
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select(`*, batches (name)`) // Select updated fields including batch name
      .single();

    if (error) {
      console.error("Error updating user profile:", error);
      showError("Failed to update user profile.");
      setUpdatingUserId(null);
      return null;
    } else {
      showSuccess("User profile updated successfully!");
      // Refetch all users to ensure data consistency from the view
      fetchUsers();
      setUpdatingUserId(null);
      return data;
    }
  };

  const deleteUser = async (userId: string) => {
    setUpdatingUserId(userId); // Indicate that this user is being processed
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Authentication error. Please sign in again.");
      }
      
      const response = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (response.error) {
        throw response.error;
      }

      showSuccess("User deleted successfully!");
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      return true;
    } catch (error: any) {
      console.error("Error deleting user:", error);
      showError(`Failed to delete user: ${error.message}`);
      return false;
    } finally {
      setUpdatingUserId(null);
    }
  };

  return {
    users,
    loading,
    updatingUserId,
    fetchUsers, // Expose for manual refresh if needed
    toggleAdminStatus,
    updateUser,
    deleteUser, // Expose the new delete function
  };
};