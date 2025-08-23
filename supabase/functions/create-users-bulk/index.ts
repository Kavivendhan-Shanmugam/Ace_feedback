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
      throw new Error('Permission denied: You must be an admin to create users.');
    }

    // 2. Get the users array from the request body
    const { users } = await req.json()
    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing or invalid "users" array in request body' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    // 3. Create an admin client to perform user creation
    const adminSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const results = {
      success: [],
      failed: [],
    }

    // 4. Process each user
    for (const user of users) {
      try {
        // Create the user in auth.users
        const { data: authData, error: authError } = await adminSupabaseClient.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            first_name: user.first_name,
            last_name: user.last_name,
          },
        })

        if (authError) {
          throw new Error(`Auth error: ${authError.message}`);
        }

        // The handle_new_user trigger creates the profile. Now, update it.
        const { error: profileError } = await adminSupabaseClient
          .from('profiles')
          .update({
            batch_id: user.batch_id,
            semester_number: user.semester_number,
          })
          .eq('id', authData.user.id)

        if (profileError) {
          // If profile update fails, we should probably delete the created user to avoid orphaned accounts
          await adminSupabaseClient.auth.admin.deleteUser(authData.user.id);
          throw new Error(`Profile update error: ${profileError.message}. User creation rolled back.`);
        }

        results.success.push({ email: user.email, message: 'User created successfully.' });
      } catch (error) {
        results.failed.push({ email: user.email, error: error.message });
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