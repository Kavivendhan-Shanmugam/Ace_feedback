"use client";

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { showError, showSuccess } from '@/utils/toast';
import { Feedback } from '@/types/supabase';

export const useFeedbackManager = () => {
  const [feedbackEntries, setFeedbackEntries] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    const result = await apiClient.getFeedback();

    if (result.error) {
      console.error("Error fetching feedback:", result.error);
      showError("Failed to load feedback entries.");
    } else {
      setFeedbackEntries(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFeedback();
    // Note: Real-time subscriptions are not implemented in MySQL API
    // Consider adding polling or manual refresh if needed
  }, [fetchFeedback]);

  const updateAdminResponse = async (feedbackId: string, response: string | null) => {
    setIsSubmittingResponse(true);
    const result = await apiClient.updateFeedback(feedbackId, {
      adminResponse: response,
      isResponseSeenByStudent: false // Reset flag to notify student
    });

    if (result.error) {
      console.error("Error updating feedback response:", result.error);
      showError(`Failed to update feedback response: ${result.error}`);
      setIsSubmittingResponse(false);
      return null;
    } else {
      showSuccess("Feedback response updated successfully!");
      await fetchFeedback(); // Manually refresh since no real-time subscriptions
      setIsSubmittingResponse(false);
      return result.data;
    }
  };

  const deleteFeedback = async (feedbackId: string) => {
    // Note: Delete functionality not implemented in current API client
    // This would need to be added to the API client and server if needed
    console.warn("Delete feedback not implemented in MySQL API");
    showError("Delete feedback functionality is not currently available.");
    return false;
  };

  return {
    feedbackEntries,
    loading,
    isSubmittingResponse,
    fetchFeedback,
    updateAdminResponse,
    deleteFeedback,
  };
};