"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { mysql, apiClient } from "@/lib/api-client";
import { Profile } from "@/types/supabase"; // Import Profile type

// Mock session interface for compatibility
interface Session {
  access_token: string;
  user: {
    id: string;
    email: string;
  };
}

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isProfileIncompleteRedirect: boolean;
  setIsProfileIncompleteRedirect: (value: boolean) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isProfileIncompleteRedirect, setIsProfileIncompleteRedirect] = useState(false);

  useEffect(() => {
    const checkSessionAndProfile = async () => {
      try {
        const token = localStorage.getItem('auth_token');

        if (!token) {
          setSession(null);
          setIsAdmin(false);
          setIsProfileIncompleteRedirect(false);
          setIsLoading(false);
          return;
        }

        // Check if backend is available
        try {
          const healthCheck = await fetch('http://localhost:3001/api/health', {
            method: 'GET',
            timeout: 5000
          });
          
          if (!healthCheck.ok) {
            throw new Error('Backend not available');
          }
        } catch (healthError) {
          console.warn('Backend not available, continuing without session:', healthError);
          setSession(null);
          setIsAdmin(false);
          setIsProfileIncompleteRedirect(false);
          setIsLoading(false);
          return;
        }

        // Get profile using MySQL API
        const response = await fetch('http://localhost:3001/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const profile = await response.json();

        // Create session object
        const mockSession: Session = {
          access_token: token,
          user: {
            id: profile.id,
            email: profile.email || ''
          }
        };
        
        setSession(mockSession);
        setIsAdmin(profile.is_admin || false);
        
        // Admins only need a name, students need name, batch, and semester
        if (profile.is_admin) {
          setIsProfileIncompleteRedirect(!profile.first_name || !profile.last_name);
        } else {
          setIsProfileIncompleteRedirect(!profile.first_name || !profile.last_name || !profile.batch_id || !profile.semester_number);
        }
      } catch (error) {
        console.error("Error checking session:", error);
        localStorage.removeItem('auth_token');
        setSession(null);
        setIsAdmin(false);
        setIsProfileIncompleteRedirect(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSessionAndProfile();

    // Listen for storage changes (login/logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token') {
        setIsLoading(true);
        checkSessionAndProfile();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <SessionContext.Provider value={{ session, isLoading, isAdmin, isProfileIncompleteRedirect, setIsProfileIncompleteRedirect }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionContextProvider");
  }
  return context;
};