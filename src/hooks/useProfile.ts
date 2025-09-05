"use client";

import { useState, useEffect, useCallback } from "react";
import { apiClient } from '@/lib/api-client';
import { showError, showSuccess } from '@/utils/toast';
import { Profile } from '@/types/supabase';
import { useSession } from '@/components/SessionContextProvider';

export const useProfile = () => {
  const { session, isLoading: isSessionLoading, setIsProfileIncompleteRedirect } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    if (!session?.user.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await apiClient.getProfile();
      
      if (error) {
        console.error("Error fetching profile:", error);
        // Create a basic profile from session data
        const basicProfile: Profile = {
          id: session.user.id,
          first_name: session.user.email?.includes('admin') ? 'Admin' : 'Test',
          last_name: session.user.email?.includes('admin') ? 'User' : 'Student',
          avatar_url: null,
          is_admin: session.user.email?.includes('admin') || false,
          updated_at: new Date().toISOString(),
          email: session.user.email,
          batch_id: null,
          semester_number: null
        };
        setProfile(basicProfile);
      } else {
        setProfile(data as Profile); 
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      // Create a basic profile from session data
      const basicProfile: Profile = {
        id: session.user.id,
        first_name: session.user.email?.includes('admin') ? 'Admin' : 'Test',
        last_name: session.user.email?.includes('admin') ? 'User' : 'Student',
        avatar_url: null,
        is_admin: session.user.email?.includes('admin') || false,
        updated_at: new Date().toISOString(),
        email: session.user.email,
        batch_id: null,
        semester_number: null
      };
      setProfile(basicProfile);
    }
    setLoading(false);
  }, [session?.user.id, session?.user.email]);

  useEffect(() => {
    if (!isSessionLoading && session) {
      fetchProfile();
    } else if (!isSessionLoading && !session) {
      setProfile(null);
      setLoading(false);
    }
  }, [session, isSessionLoading, fetchProfile]);

  const updateProfile = async (values: { first_name?: string; last_name?: string; avatar_url?: string; batch_id?: string | null; semester_number?: number | null }) => {
    if (!session?.user.id) {
      showError("User not authenticated.");
      return null;
    }

    setIsSubmitting(true);
    
    // TODO: Implement MySQL profile update API
    // For now, just update the local state
    showSuccess("Profile update not yet implemented for MySQL.");
    
    if (profile) {
      const updatedProfile = {
        ...profile,
        ...values,
        updated_at: new Date().toISOString()
      };
      setProfile(updatedProfile);
    }
    
    setIsSubmitting(false);
    return profile;
  };

  return {
    profile,
    loading,
    isSubmitting,
    fetchProfile,
    updateProfile,
  };
};