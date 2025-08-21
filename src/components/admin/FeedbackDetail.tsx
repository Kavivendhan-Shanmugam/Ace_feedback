"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Trash2 } from 'lucide-react';
import { Feedback } from '@/types/supabase';
import RatingStars from '../RatingStars';
import ConfirmAlertDialog from '../ConfirmAlertDialog';
import { Separator } from '../ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

const formSchema = z.object({
  admin_response: z.string().max(500, "Response cannot exceed 500 characters").optional(),
});

type FeedbackResponseFormValues = z.infer<typeof formSchema>;

interface FeedbackDetailProps {
  feedback: Feedback;
  onUpdateResponse: (feedbackId: string, response: string | null) => Promise<any>;
  onDelete: (feedbackId: string) => Promise<any>;
  isSubmitting: boolean;
  onClearSelection: () => void;
}

const FeedbackDetail: React.FC<FeedbackDetailProps> = ({ feedback, onUpdateResponse, onDelete, isSubmitting, onClearSelection }) => {
  const form = useForm<FeedbackResponseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      admin_response: feedback.admin_response || "",
    },
  });

  // Reset form when feedback selection changes
  React.useEffect(() => {
    form.reset({ admin_response: feedback.admin_response || "" });
  }, [feedback, form]);

  const handleSubmit = (values: FeedbackResponseFormValues) => {
    onUpdateResponse(feedback.id, values.admin_response || null);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle>Feedback Details</CardTitle>
          <CardDescription>
            Submitted on {new Date(feedback.created_at).toLocaleString()}
          </CardDescription>
        </div>
        <ConfirmAlertDialog
          title="Are you absolutely sure?"
          description="This will permanently delete this feedback entry."
          onConfirm={() => onDelete(feedback.id).then(onClearSelection)}
        >
          <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
        </ConfirmAlertDialog>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto space-y-4">
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="flex justify-between items-center mb-2">
            <p className="font-semibold">{feedback.subjects.name} {feedback.subjects.period ? `(P${feedback.subjects.period})` : ''}</p> {/* Renamed from classes.name, added period */}
            <RatingStars rating={feedback.rating} starClassName="h-5 w-5" />
          </div>
          <Separator />
          <div className="mt-4">
            <h4 className="font-medium mb-2">Student's Comment</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap min-h-[60px]">
              {feedback.comment || "No comment provided."}
            </p>
          </div>
        </div>
        
        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="admin_response"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Administrator's Response</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Type your response here..."
                        {...field}
                        value={field.value || ''}
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? "Saving..." : "Save Response"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackDetail;