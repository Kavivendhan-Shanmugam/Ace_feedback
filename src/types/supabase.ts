export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  updated_at: string;
  email?: string; // Added back as optional for RPC function return
  batch_id: string | null;
  semester_number: number | null;
  batches?: { // Joined batch data
    name: string;
  };
}

export interface Batch {
  id: string;
  name: string;
  created_at: string;
}

export interface Subject {
  id:string;
  name: string;
  period: number | null;
  batch_id: string | null;
  semester_number: number | null;
  created_at: string;
  batch_name?: string; // Direct batch name from MySQL API
  batches?: { // Joined batch data (for backward compatibility)
    name: string;
  };
}

export interface TimetableEntry {
  id: string;
  day_of_week: number;
  class_id: string;
  batch_id: string | null;
  semester_number: number | null;
  created_at: string;
  start_time: string;
  end_time: string;
  subject_name?: string; // Direct subject name from MySQL API
  batch_name?: string; // Direct batch name from MySQL API
  subjects?: { // Joined subject data (for backward compatibility)
    id: string;
    name: string;
    period: number | null;
  };
  batches?: { // Joined batch data (for backward compatibility)
    name: string;
  };
}

export interface Feedback {
  id: string;
  student_id: string;
  class_id: string;
  batch_id: string | null;
  semester_number: number | null;
  rating: number;
  comment: string | null;
  admin_response: string | null;
  created_at: string;
  is_response_seen_by_student?: boolean;
  additional_feedback?: {
    question_id: string;
    question_text: string;
    answer: string | string[];
  }[];
  subjects: {
    name: string;
    period?: number | null;
  };
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    batch_id: string | null;
    semester_number: number | null;
    avatar_url?: string | null;
  };
  batches?: {
    name: string;
  };
}

// New interface for Feedback Questions
export interface FeedbackQuestion {
  id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice';
  options: string[] | null;
  batch_id: string | null;
  semester_number: number | null;
  created_at: string;
  batches?: {
    name: string;
  };
}

// Specific types for hooks/components that might need slightly different structures
export interface DailySubject { // Renamed from DailyClass
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  hasSubmittedFeedback?: boolean;
  batch_id: string | null;
  semester_number: number | null;
}

export interface FeedbackHistoryEntry extends Feedback {
  subjects: {
    name: string;
  };
}

export interface SubjectFeedbackStats { // Renamed from ClassFeedbackStats
  subject_id: string; // Renamed from class_id
  subject_name: string; // Renamed from class_name
  average_rating: number;
  feedback_count: bigint;
  rating_counts: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
}

export interface SubjectPerformanceSummary { // Renamed from ClassPerformanceSummary
  subject_id: string; // Renamed from class_id
  subject_name: string; // Renamed from class_name
  average_rating: number;
  feedback_count: number;
}

export interface FeedbackTrendPoint {
  date: string;
  submission_count: number;
  average_rating: number | null;
}