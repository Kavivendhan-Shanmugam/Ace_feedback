"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Star, Filter, ChevronsUpDown, XCircle, Inbox } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeedbackManager } from '@/hooks/useFeedbackManager';
import RatingStars from './RatingStars';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import FeedbackDetail from './admin/FeedbackDetail';
import { useBatches } from '@/hooks/useBatches'; // Import useBatches

const FeedbackManager: React.FC = () => {
  const {
    feedbackEntries,
    loading,
    isSubmittingResponse,
    updateAdminResponse,
    deleteFeedback,
  } = useFeedbackManager();
  const { batches, loading: batchesLoading } = useBatches(); // Fetch batches
  const location = useLocation();
  
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState<string[]>([]);
  const [subjectFilter, setSubjectFilter] = useState('all'); // Renamed from classFilter
  const [batchFilter, setBatchFilter] = useState('all'); // New filter
  const [semesterFilter, setSemesterFilter] = useState('all'); // New filter
  const [searchTerm, setSearchTerm] = useState('');

  const handleClearFilters = () => {
    setStatusFilter('all');
    setRatingFilter([]);
    setSubjectFilter('all'); // Renamed
    setBatchFilter('all'); // New
    setSemesterFilter('all'); // New
    setSearchTerm('');
  };

  useEffect(() => {
    if (location.state) {
      const { subjectId, studentName, feedbackId } = location.state;
      
      // Prioritize direct feedback ID linking
      if (feedbackId && feedbackEntries.length > 0) {
        const feedbackExists = feedbackEntries.some(f => f.id === feedbackId);
        if (feedbackExists) {
          // Clear filters to ensure the item is visible in the list
          handleClearFilters();
          // Set the selected ID
          setSelectedFeedbackId(feedbackId);
        }
      } else {
        // Handle older filter-based navigation
        if (subjectId) setSubjectFilter(subjectId);
        if (studentName) setSearchTerm(studentName);
      }
      
      // Clear the state to prevent re-triggering on component re-renders
      window.history.replaceState({}, document.title);
    }
  }, [location.state, feedbackEntries]);

  const activeFilterCount = [
    statusFilter !== 'all',
    ratingFilter.length > 0,
    subjectFilter !== 'all', // Renamed
    batchFilter !== 'all', // New
    semesterFilter !== 'all', // New
    searchTerm !== '',
  ].filter(Boolean).length;

  const availableSubjects = useMemo(() => {
    if (!feedbackEntries) return [];
    const uniqueSubjects = new Map<string, { name: string; period: number | null; batchName: string | undefined; semesterNumber: number | null }>();
    feedbackEntries.forEach(entry => {
      if (entry.subjects && !uniqueSubjects.has(entry.class_id)) {
        uniqueSubjects.set(entry.class_id, {
          name: entry.subjects.name,
          period: entry.subjects.period,
          batchName: entry.batches?.name,
          semesterNumber: entry.semester_number,
        });
      }
    });
    return Array.from(uniqueSubjects.entries()).map(([id, data]) => ({ id, ...data })).sort((a, b) => a.name.localeCompare(b.name));
  }, [feedbackEntries]);

  const filteredFeedback = useMemo(() => {
    let filtered = [...feedbackEntries];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => (statusFilter === 'responded' ? !!entry.admin_response : !entry.admin_response));
    }
    if (ratingFilter.length > 0) {
      filtered = filtered.filter(entry => ratingFilter.includes(entry.rating.toString()));
    }
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(entry => entry.class_id === subjectFilter);
    }
    if (batchFilter !== 'all') {
      filtered = filtered.filter(entry => entry.batch_id === batchFilter);
    }
    if (semesterFilter !== 'all') {
      filtered = filtered.filter(entry => entry.semester_number === parseInt(semesterFilter));
    }
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(entry =>
        `${entry.profiles?.first_name || ''} ${entry.profiles?.last_name || ''}`.toLowerCase().includes(lowercasedSearchTerm)
      );
    }
    
    // Default sort by creation date descending
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  }, [feedbackEntries, statusFilter, ratingFilter, subjectFilter, batchFilter, semesterFilter, searchTerm]);

  const selectedFeedback = useMemo(() => {
    return feedbackEntries.find(f => f.id === selectedFeedbackId) || null;
  }, [selectedFeedbackId, feedbackEntries]);

  // When filters change, if the selected feedback is no longer in the filtered list, deselect it.
  useEffect(() => {
    if (selectedFeedbackId && !filteredFeedback.find(f => f.id === selectedFeedbackId)) {
      setSelectedFeedbackId(null);
    }
  }, [filteredFeedback, selectedFeedbackId]);

  const renderFeedbackList = () => {
    if (loading) {
      return (
        <div className="space-y-2 p-2">
          {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      );
    }

    if (filteredFeedback.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No Feedback Found</h3>
          <p className="text-sm text-muted-foreground">
            No feedback entries match the current filters. Try adjusting your search.
          </p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-full">
        <div className="p-2 space-y-2">
          {filteredFeedback.map(feedback => (
            <button
              key={feedback.id}
              onClick={() => setSelectedFeedbackId(feedback.id)}
              className={cn(
                "w-full text-left p-3 border rounded-lg transition-colors",
                "hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                selectedFeedbackId === feedback.id ? "bg-muted" : "bg-card"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-grow">
                  <p className="font-semibold">{feedback.profiles?.first_name} {feedback.profiles?.last_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {feedback.subjects.name}
                    {feedback.batches?.name && ` (${feedback.batches.name})`}
                    {feedback.semester_number && ` Sem ${feedback.semester_number}`}
                  </p>
                </div>
                <RatingStars rating={feedback.rating} />
              </div>
              <p className="text-sm text-muted-foreground mt-2 truncate">
                {feedback.comment || "No comment provided."}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <div className="h-[calc(100vh-150px)] flex flex-col">
      <CardHeader>
        <CardTitle>Manage Student Feedback</CardTitle>
        <CardDescription>Review, respond to, and manage all student feedback entries.</CardDescription>
      </CardHeader>
      
      <Collapsible
        open={isFilterOpen}
        onOpenChange={setIsFilterOpen}
        className="mb-4 border rounded-lg mx-6"
      >
        <div className="flex items-center justify-between p-2 pr-4">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="flex items-center text-sm font-semibold">
              <Filter className="h-4 w-4 mr-2" />
              Filters & Search
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2">{activeFilterCount}</Badge>
              )}
              <ChevronsUpDown className="h-4 w-4 ml-2 text-muted-foreground" />
            </Button>
          </CollapsibleTrigger>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <XCircle className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
        <CollapsibleContent>
          <div className="flex flex-col gap-4 p-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                placeholder="Search by student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Select value={batchFilter} onValueChange={setBatchFilter} disabled={batchesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Batch..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {batches.map(batch => (
                    <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={semesterFilter} onValueChange={setSemesterFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Semester..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                    <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by subject..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {availableSubjects.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name} {sub.period ? `(P${sub.period})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <ToggleGroup type="single" value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
                  <ToggleGroupItem value="all">All</ToggleGroupItem>
                  <ToggleGroupItem value="unresponded">Unresponded</ToggleGroupItem>
                  <ToggleGroupItem value="responded">Responded</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Ratings:</span>
                <ToggleGroup type="multiple" value={ratingFilter} onValueChange={setRatingFilter}>
                  {[1, 2, 3, 4, 5].map(r => (
                    <ToggleGroupItem key={r} value={r.toString()} className="p-2"><Star className="h-4 w-4" /></ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex-grow overflow-hidden px-6 pb-6">
        <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
          <ResizablePanel defaultSize={35} minSize={25}>
            {renderFeedbackList()}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={65} minSize={40}>
            <div className="h-full p-4">
              {selectedFeedback ? (
                <FeedbackDetail
                  feedback={selectedFeedback}
                  onUpdateResponse={updateAdminResponse}
                  onDelete={deleteFeedback}
                  isSubmitting={isSubmittingResponse}
                  onClearSelection={() => setSelectedFeedbackId(null)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Select Feedback</h3>
                  <p className="text-sm text-muted-foreground">
                    Choose a feedback entry from the list to view its details and respond.
                  </p>
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default FeedbackManager;