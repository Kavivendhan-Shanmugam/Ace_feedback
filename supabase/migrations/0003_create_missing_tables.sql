-- 1. Create the batches table
CREATE TABLE IF NOT EXISTS public.batches (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.batches IS 'Stores information about student batches/years.';

-- 2. Add batch_id and semester_number to profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'batch_id') THEN
    ALTER TABLE public.profiles ADD COLUMN batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'semester_number') THEN
    ALTER TABLE public.profiles ADD COLUMN semester_number INT;
  END IF;
END $$;

-- 3. Create the subjects table (renamed from classes)
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  period INT,
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  semester_number INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.subjects IS 'Stores information about subjects/classes for different batches.';

-- 4. Update timetables table to reference subjects instead of classes and add batch info
DO $$
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timetables' AND column_name = 'start_time') THEN
    ALTER TABLE public.timetables ADD COLUMN start_time TIME;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timetables' AND column_name = 'end_time') THEN
    ALTER TABLE public.timetables ADD COLUMN end_time TIME;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timetables' AND column_name = 'batch_id') THEN
    ALTER TABLE public.timetables ADD COLUMN batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'timetables' AND column_name = 'semester_number') THEN
    ALTER TABLE public.timetables ADD COLUMN semester_number INT;
  END IF;
END $$;

-- 5. Update feedback table to add batch info
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'batch_id') THEN
    ALTER TABLE public.feedback ADD COLUMN batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'semester_number') THEN
    ALTER TABLE public.feedback ADD COLUMN semester_number INT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'feedback' AND column_name = 'additional_feedback') THEN
    ALTER TABLE public.feedback ADD COLUMN additional_feedback JSONB;
  END IF;
END $$;

-- 6. Create feedback_questions table
CREATE TABLE IF NOT EXISTS public.feedback_questions (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'multiple_choice')),
  options TEXT[],
  batch_id UUID REFERENCES public.batches(id) ON DELETE CASCADE,
  semester_number INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.feedback_questions IS 'Stores custom feedback questions for different batches.';

-- 7. Enable RLS for new tables
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_questions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for batches table
CREATE POLICY "Allow authenticated users to read batches"
ON public.batches FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage batches"
ON public.batches FOR ALL
TO authenticated
USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- 9. Create RLS policies for subjects table
CREATE POLICY "Allow authenticated users to read subjects"
ON public.subjects FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage subjects"
ON public.subjects FOR ALL
TO authenticated
USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- 10. Create RLS policies for feedback_questions table
CREATE POLICY "Allow authenticated users to read feedback questions"
ON public.feedback_questions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admins to manage feedback questions"
ON public.feedback_questions FOR ALL
TO authenticated
USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- 11. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_batch_id ON public.profiles(batch_id);
CREATE INDEX IF NOT EXISTS idx_subjects_batch_semester ON public.subjects(batch_id, semester_number);
CREATE INDEX IF NOT EXISTS idx_timetables_batch_semester ON public.timetables(batch_id, semester_number);
CREATE INDEX IF NOT EXISTS idx_feedback_batch_semester ON public.feedback(batch_id, semester_number);
CREATE INDEX IF NOT EXISTS idx_feedback_questions_batch_semester ON public.feedback_questions(batch_id, semester_number);

-- 12. Update existing functions and create new ones

-- Function to get subject feedback stats (updated from class stats)
CREATE OR REPLACE FUNCTION get_subject_feedback_stats()
RETURNS TABLE (
  subject_id UUID,
  subject_name TEXT,
  average_rating NUMERIC,
  feedback_count BIGINT,
  rating_counts JSONB
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id AS subject_id,
    s.name AS subject_name,
    AVG(f.rating) AS average_rating,
    COUNT(f.id) AS feedback_count,
    jsonb_object_agg(
      f.rating::text,
      (SELECT COUNT(*) FROM public.feedback WHERE class_id = s.id AND rating = f.rating)
    ) FILTER (WHERE f.rating IS NOT NULL) AS rating_counts
  FROM
    public.subjects s
  LEFT JOIN
    public.feedback f ON s.id = f.class_id
  GROUP BY
    s.id, s.name
  ORDER BY
    average_rating DESC NULLS LAST;
$$;

-- Function to get current day subjects for a student
CREATE OR REPLACE FUNCTION get_daily_subjects(student_batch_id UUID, student_semester_number INT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  start_time TIME,
  end_time TIME,
  batch_id UUID,
  semester_number INT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    s.id,
    s.name,
    t.start_time,
    t.end_time,
    s.batch_id,
    s.semester_number
  FROM
    public.subjects s
  JOIN
    public.timetables t ON s.id = t.class_id
  WHERE
    s.batch_id = student_batch_id
    AND s.semester_number = student_semester_number
    AND t.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
  ORDER BY
    t.start_time;
$$;
