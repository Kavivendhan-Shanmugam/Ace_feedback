"use client";

import { Auth } from '@supabase/auth-ui-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/components/SessionContextProvider';
import { customAuthTheme } from '@/lib/supabaseAuthTheme';
import { Skeleton } from '@/components/ui/skeleton';

function Login() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-5 w-1/2 mx-auto" />
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (session) {
    // SessionContextProvider will handle redirect if session exists
    return null;
  }

  return (
    <div className="flex items-center justify-center h-full p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Student Account</CardTitle>
          <CardDescription>Sign in or create an account to provide feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            providers={[]} // No third-party providers unless specified
            appearance={{
              theme: customAuthTheme, // Use the custom theme
            }}
            redirectTo={window.location.origin} // Redirect to root after auth, SessionContextProvider handles further redirect
            view="sign_up"
            fields={{
              sign_up: {
                additionalFields: [
                  {
                    type: 'text',
                    name: 'first_name',
                    label: 'First Name',
                    placeholder: 'Your first name',
                    required: true,
                  },
                  {
                    type: 'text',
                    name: 'last_name',
                    label: 'Last Name',
                    placeholder: 'Your last name',
                    required: true,
                  },
                ],
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;