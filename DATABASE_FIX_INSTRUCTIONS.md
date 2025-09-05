# Fix for Batch Disappearing Issue

## Problem
The batches are disappearing after refresh because the `batches` table doesn't exist in your Supabase database. The application was built to work with a complete database schema, but some tables are missing from the initial migrations.

## Solution
You need to run the new migration file `0003_create_missing_tables.sql` in your Supabase database.

## How to Fix:

### Method 1: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** 
3. Copy the entire contents of `supabase/migrations/0003_create_missing_tables.sql`
4. Paste it into the SQL Editor
5. Click **Run** to execute the migration

### Method 2: Using Supabase CLI (if you have it installed)
```bash
supabase db push
```

## What this migration does:
1. **Creates the `batches` table** - This is the main missing table causing your issue
2. **Creates the `subjects` table** - For managing subjects/classes  
3. **Creates the `feedback_questions` table** - For custom feedback questions
4. **Adds missing columns** to existing tables (batch_id, semester_number, etc.)
5. **Sets up proper RLS policies** for security
6. **Creates database indexes** for better performance
7. **Updates database functions** to work with the new schema

## After running the migration:
1. Your batches should persist after refresh
2. All other functionality (subjects, timetables, feedback) should work properly
3. The admin panel will be fully functional

## Verification:
After running the migration, try adding a batch again. It should now persist after refreshing the page.

## Note:
This migration is designed to be safe and won't affect any existing data. It uses `IF NOT EXISTS` clauses to avoid conflicts.
