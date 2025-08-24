"use client";

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedbackQuestion } from '@/types/supabase';
import { Separator } from './ui/separator';
import { Label } from './ui/label';

interface FeedbackFormProps {
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  questions: FeedbackQuestion[];
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, isSubmitting, questions }) => {
  const [hoveredRating, setHoveredRating] = useState(0);

  const formSchema = useMemo(() => {
    const questionSchemas = questions.reduce((acc, q) => {
      acc[q.id] = z.string().min(1, { message: "Please provide an answer." });
      return acc;
    }, {} as Record<string, z.ZodString>);

    return z.object({
      rating: z.coerce.number().min(1, "Please select a rating").max(5, "Rating must be between 1 and 5"),
      comment: z.string().max(500, "Comment cannot exceed 500 characters").optional(),
      ...questionSchemas,
    });
  }, [questions]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      comment: "",
      ...questions.reduce((acc, q) => ({ ...acc, [q.id]: '' }), {}),
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Standard Rating and Comment */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Overall Rating</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                    className="flex space-x-2"
                  >
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <FormItem key={starValue}>
                        <FormControl>
                          <RadioGroupItem
                            value={starValue.toString()}
                            id={`rating-${starValue}`}
                            className="sr-only"
                          />
                        </FormControl>
                        <label
                          htmlFor={`rating-${starValue}`}
                          className={cn(
                            "cursor-pointer text-gray-300 transition-colors",
                            (starValue <= (hoveredRating || field.value)) && "text-yellow-500"
                          )}
                          onMouseEnter={() => setHoveredRating(starValue)}
                          onMouseLeave={() => setHoveredRating(0)}
                        >
                          <Star className="h-6 w-6 fill-current" />
                        </label>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>General Comment (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any additional feedback?" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Dynamic Questions */}
        {questions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Additional Questions</h3>
              {questions.map((question) => (
                <FormField
                  key={question.id}
                  control={form.control}
                  name={question.id as any}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{question.question_text}</FormLabel>
                      <FormControl>
                        {question.question_type === 'text' ? (
                          <Textarea placeholder="Your answer..." {...field} />
                        ) : (
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col space-y-1"
                          >
                            {question.options?.map((option, index) => (
                              <FormItem key={index} className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value={option} />
                                </FormControl>
                                <FormLabel className="font-normal">{option}</FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </>
        )}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </form>
    </Form>
  );
};

export default FeedbackForm;