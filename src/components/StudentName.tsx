"use client";

import React from 'react';
import { Profile } from '@/types/supabase';
import { Skeleton } from '@/components/ui/skeleton';

interface StudentNameProps {
  profile: Profile | null;
  loading: boolean;
}

const StudentName: React.FC<StudentNameProps> = ({ profile, loading }) => {
  if (loading) {
    return <Skeleton className="h-6 w-32 inline-block" />;
  }

  if (!profile) {
    return <span>Student</span>;
  }

  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();

  return <span>{fullName || 'Student'}</span>;
};

export default StudentName;