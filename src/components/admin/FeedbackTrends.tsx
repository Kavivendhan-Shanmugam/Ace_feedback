"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeedbackTrends } from '@/hooks/useFeedbackTrends';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface FeedbackTrendsProps {
  batchId?: string;
  semesterNumber?: number;
}

const FeedbackTrends: React.FC<FeedbackTrendsProps> = ({ batchId, semesterNumber }) => {
  const [timeframe, setTimeframe] = useState(30);
  const { trendData, loading } = useFeedbackTrends(timeframe, batchId, semesterNumber);

  const handleTimeframeChange = (value: string) => {
    if (value) {
      setTimeframe(parseInt(value));
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Feedback Trends</CardTitle>
            <CardDescription>Submissions and average rating over time.</CardDescription>
          </div>
          <ToggleGroup type="single" defaultValue="30" onValueChange={handleTimeframeChange}>
            <ToggleGroupItem value="7">7D</ToggleGroupItem>
            <ToggleGroupItem value="30">30D</ToggleGroupItem>
            <ToggleGroupItem value="90">90D</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-[350px] w-full" />
        ) : trendData.length === 0 ? (
          <p className="text-center h-[350px] flex items-center justify-center">No feedback data available for this timeframe.</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} />
              <YAxis yAxisId="left" label={{ value: 'Submissions', angle: -90, position: 'insideLeft' }} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" domain={[1, 5]} label={{ value: 'Avg. Rating', angle: 90, position: 'insideRight' }} />
              <Tooltip
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                formatter={(value, name) => [value, name === 'submission_count' ? 'Submissions' : 'Average Rating']}
              />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="submission_count" stroke="#8884d8" name="Submissions" />
              <Line yAxisId="right" type="monotone" dataKey="average_rating" stroke="#82ca9d" name="Average Rating" connectNulls />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackTrends;