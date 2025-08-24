"use client";

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Calendar, MessageSquare, BarChart2, Layers, Users, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { to: '/admin/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/admin/batches', icon: Layers, label: 'Batches' },
  { to: '/admin/students', icon: Users, label: 'Students' },
  { to: '/admin/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/admin/timetable', icon: Calendar, label: 'Timetable' },
  { to: '/admin/feedback', icon: MessageSquare, label: 'Feedback' },
  { to: '/admin/feedback-questions', icon: HelpCircle, label: 'Feedback Questions' },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics' },
];

const AdminSidebar: React.FC = () => {
  const baseLinkClass = "flex items-center p-2 text-base font-normal rounded-lg transition duration-75";
  const linkTextColor = "text-gray-900 dark:text-white";
  const hoverClasses = "hover:bg-gray-100 dark:hover:bg-gray-700";

  const activeLinkClass = "bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90";
  const inactiveLinkClass = `${linkTextColor} ${hoverClasses}`;

  return (
    <aside className="w-64 flex-shrink-0" aria-label="Sidebar">
      <div className="overflow-y-auto h-full py-4 px-3 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
        <ul className="space-y-2">
          {navLinks.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end
                className={({ isActive }) => cn(baseLinkClass, isActive ? activeLinkClass : inactiveLinkClass)}
              >
                {({ isActive }) => (
                  <>
                    <Icon className={cn("w-6 h-6 transition duration-75", isActive ? "text-primary-foreground" : "text-gray-500 dark:text-gray-400")} />
                    <span className="ml-3">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default AdminSidebar;