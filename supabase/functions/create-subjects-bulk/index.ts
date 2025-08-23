import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Check if the user is an admin
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    const { data: isAdminData, error: isAdminError } = await userSupabaseClient.rpc('is_admin_user');
    if (isAdminError || !isAdminData) {
      throw new Error('Permission denied: You must be an admin to create subjects.');
    }

    // 2. Get the subjects array from the request body
    const { subjects } = await req.json()
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid "subjects" array in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 3. Create an admin client to perform subject creation
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const results = {
      success: [],
      failed: [],
    }

    // 4. Process each subject
    for (const subject of subjects) {
      try {
        const { data, error } = await adminSupabaseClient
          .from('subjects')
          .insert({
            name: subject.name,
            period: subject.period,
            batch_id: subject.batch_id,
            semester_number: subject.semester_number,
          })
          .select()
          .single()

        if (error) {
          throw new Error(`Database error: ${error.message}`);
        }

        results.success.push({ name: subject.name, message: 'Subject created successfully.' });
      } catch (error) {
        results.failed.push({ name: subject.name, error: error.message });
      }
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})