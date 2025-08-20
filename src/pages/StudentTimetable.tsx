"use client";

import React from 'react';
import { useWeeklyTimetable } from '@/hooks/useWeeklyTimetable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatTime } from '@/lib/utils'; // Import the new utility

const StudentTimetable = () => {
  const { groupedTimetable, loading, daysOfWeek } = useWeeklyTimetable();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center p-4 h-full">
      <div className="w-full max-w-5xl mb-8">
        <div className="flex items-center justify-between">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-200">Your Weekly Timetable</h1>
            <Button variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Button>
        </div>
      </div>

      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>Your subject schedule for the week.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <Skeleton className="h-[400px] w-full" />
          ) : (
            <Tabs defaultValue="1" className="w-full">
              <TabsList className="grid w-full grid-cols-7">
                {daysOfWeek.map(day => (
                  <TabsTrigger key={day.value} value={day.value.toString()}>{day.label}</TabsTrigger>
                ))}
              </TabsList>
              {daysOfWeek.map(day => (
                <TabsContent key={day.value} value={day.value.toString()}>
                  <div className="mt-4 space-y-4">
                    {groupedTimetable[day.value].length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <p>No subjects scheduled for {day.label}.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {groupedTimetable[day.value].map(entry => (
                          <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                            <p className="font-semibold">{entry.subjects.name} {entry.subjects.period ? `(P${entry.subjects.period})` : ''}</p>
                            <p className="text-sm text-muted-foreground">{formatTime(entry.start_time)} - {formatTime(entry.end_time)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentTimetable;