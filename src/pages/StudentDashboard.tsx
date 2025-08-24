"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import FeedbackForm from '@/components/FeedbackForm';
import { CheckCircle, Info } from 'lucide-react';
import { useDailySubjects } from '@/hooks/useDailySubjects';
import { showError, showSuccess } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfile } from '@/hooks/useProfile';
import StudentName from '@/components/StudentName';
import { useStudentFeedbackQuestions } from '@/hooks/useStudentFeedbackQuestions';

const StudentDashboard = () => {
  const { session, isLoading: isSessionLoading, isAdmin } = useSession();
  const { profile, loading: profileLoading } = useProfile();
  const { questions, loading: questionsLoading } = useStudentFeedbackQuestions();

  const {
    activeFeedbackSubject,
    hasSubmittedFeedbackForActiveSubject,
    loading: subjectsLoading,
    fetchDailySubjects
  } = useDailySubjects();

  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const isLoading = isSessionLoading || subjectsLoading || profileLoading || questionsLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center p-4 h-full space-y-8">
        <div className="w-full max-w-6xl">
          <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-10 w-48" />
          </div>
          <Skeleton className="h-7 w-3/4" />
        </div>
        <div className="w-full max-w-6xl space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Skeleton className="h-64 lg:col-span-2" />
            <Skeleton className="h-64 lg:col-span-1" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!session || isAdmin) {
    return null;
  }

  const handleFeedbackSubmit = async (values: any) => {
    if (!session?.user.id || !activeFeedbackSubject?.id || !profile?.batch_id || !profile?.semester_number) {
      showError("Cannot submit feedback: User, subject, batch, or semester information missing.");
      return;
    }

    setIsSubmittingFeedback(true);
    const { rating, comment, ...additionalAnswers } = values;

    const additional_feedback_payload = questions.map(q => ({
      question_id: q.id,
      question_text: q.question_text,
      answer: additionalAnswers[q.id]
    }));

    const { error } = await supabase.from('feedback').insert({
      student_id: session.user.id,
      class_id: activeFeedbackSubject.id,
      batch_id: profile.batch_id,
      semester_number: profile.semester_number,
      rating: rating,
      comment: comment,
      additional_feedback: additional_feedback_payload,
    });

    if (error) {
      console.error("Error submitting feedback:", error);
      showError("Failed to submit feedback. You might have already submitted feedback for this subject.");
    } else {
      showSuccess("Feedback submitted successfully!");
      fetchDailySubjects();
    }
    setIsSubmittingFeedback(false);
  };

  return (
    <div className="flex flex-col items-center p-4 h-full space-y-8">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold mb-2 text-gray-800 dark:text-gray-200">Student Dashboard</h1>
        <p className="text-xl text-muted-foreground">
          Welcome back, <StudentName profile={profile} loading={profileLoading} />!
        </p>
      </div>

      <div className="w-full max-w-md">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Subject Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {activeFeedbackSubject ? (
              hasSubmittedFeedbackForActiveSubject ? (
                <div className="text-center text-green-600 dark:text-green-400 flex flex-col items-center justify-center h-full py-8">
                  <CheckCircle className="h-8 w-8 mb-2" />
                  <p>Feedback for <strong>{activeFeedbackSubject.name}</strong> submitted. Thank you!</p>
                </div>
              ) : (
                <>
                  <CardDescription>
                    Please provide your feedback for <strong>{activeFeedbackSubject.name}</strong>.
                  </CardDescription>
                  <div className="mt-4">
                    <FeedbackForm
                      onSubmit={handleFeedbackSubmit}
                      isSubmitting={isSubmittingFeedback}
                      questions={questions}
                    />
                  </div>
                </>
              )
            ) : (
              <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full py-8">
                <Info className="h-8 w-8 mb-2" />
                <p>No subject is currently active for feedback. Feedback becomes available at the start of each subject.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;