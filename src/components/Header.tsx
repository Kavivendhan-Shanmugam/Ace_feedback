"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSession } from '@/components/SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { LogOut, User, LayoutDashboard } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 hidden sm:flex">
            <Link to={isAdmin ? "/admin/dashboard" : "/student/dashboard"}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>

          {isAdmin ? <AdminNotificationBell /> : <NotificationBell />}

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} alt="User Avatar" />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'User'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {session?.user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link to="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
};

export default Header;