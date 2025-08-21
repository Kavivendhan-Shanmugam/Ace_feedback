"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import NotificationBell from './NotificationBell';
import AdminNotificationBell from './admin/AdminNotificationBell';

const Header: React.FC = () => {
  const { session, isLoading, isAdmin } = useSession();
  const { profile, loading: profileLoading } = useProfile();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading || !session || profileLoading) {
    // Return a minimal header or null during loading/unauthenticated states
    return (
      <header className="bg-primary text-primary-foreground p-4 shadow-md w-full">
        <div className="container mx-auto flex justify-between items-center">
          <span className="text-2xl font-bold">Feedback Portal</span>
          <ThemeToggle />
        </div>
      </header>
    );
  }

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md w-full">
      <div className="container mx-auto flex justify-between items-center">
        <Link to={isAdmin ? "/admin/dashboard" : "/student/dashboard"} className="text-2xl font-bold">
          Feedback Portal
        </Link>

        <nav className="flex items-center space-x-2 sm:space-x-4">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || undefined} alt="User Avatar" />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>

          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hidden sm:flex">
            <Link to={isAdmin ? "/admin/dashboard" : "/student/dashboard"}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>

          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
            <Link to="/profile">
              <User className="mr-2 h-4 w-4" /> Profile
            </Link>
          </Button>

          {isAdmin ? <AdminNotificationBell /> : <NotificationBell />}

          <ThemeToggle />

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10">
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will be logged out of your account. You can always sign back in later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSignOut}>Sign Out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </nav>
      </div>
    </header>
  );
};

export default Header;