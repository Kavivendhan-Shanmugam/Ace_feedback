"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MessageSquare, Star, Filter, ChevronsUpDown, XCircle, Inbox, Calendar as CalendarIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFeedbackManager } from '@/hooks/useFeedbackManager';
import RatingStars from './RatingStars';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import FeedbackDetail from './admin/FeedbackDetail';
import { useBatches } from '@/hooks/useBatches';
import { useSubjects } from '@/hooks/useSubjects'; // Import useSubjects
import FeedbackTrends from './admin/FeedbackTrends';
import FeedbackBreakdown from './admin/FeedbackBreakdown';
import { Separator } from './ui/separator';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

const FeedbackManager: React.FC = () => {
  const {
    feedbackEntries,
    loading,
    isSubmittingResponse,
    updateAdminResponse,
    deleteFeedback,
  } = useFeedbackManager();
  const { batches, loading: batchesLoading } = useBatches();
  const { subjects, loading: subjectsLoading } = useSubjects(); // Use useSubjects hook
  const location = useLocation();
  
  const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
  
  const [isFilterOpen, setIsFilterOpen] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState<string[]>([]);
  const [batchFilter, setBatchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all'); // New subject filter state
  const [periodFilter, setPeriodFilter] = useState('all');
  const [date, setDate] = useState<DateRange | undefined>(undefined);

  const handleClearFilters = () => {
    setStatusFilter('all');
    setRatingFilter([]);
    setBatchFilter('all');
    setSemesterFilter('all');
    setSubjectFilter('all'); // Reset new subject filter
    setPeriodFilter('all');
    setDate(undefined);
  };

  useEffect(() => {
    if (location.state) {
      const { feedbackId } = location.state;
      
      if (feedbackId && feedbackEntries.length > 0) {
        const feedbackExists = feedbackEntries.some(f => f.id === feedbackId);
        if (feedbackExists) {
          handleClearFilters();
          setSelectedFeedbackId(feedbackId);
        }
      }
      
      window.history.replaceState({}, document.title);
    }
  }, [location.state, feedbackEntries]);

  const activeFilterCount = [
    statusFilter !== 'all',
    ratingFilter.length > 0,
    batchFilter !== 'all',
    semesterFilter !== 'all',
    subjectFilter !== 'all', // Include new subject filter
    periodFilter !== 'all',
    !!date,
  ].filter(Boolean).length;

  const filteredFeedback = useMemo(() => {
    let filtered = [...feedbackEntries];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => (statusFilter === 'responded' ? !!entry.admin_response : !entry.admin_response));
    }
    if (ratingFilter.length > 0) {
      filtered = filtered.filter(entry => ratingFilter.includes(entry.rating.toString()));
    }
    if (batchFilter !== 'all') {
      filtered = filtered.filter(entry => entry.batch_id === batchFilter);
    }
    if (semesterFilter !== 'all') {
      filtered = filtered.filter(entry => entry.semester_number === parseInt(semesterFilter));
    }
    if (subjectFilter !== 'all') { // Apply new subject filter
      filtered = filtered.filter(entry => entry.class_id === subjectFilter);
    }
    if (periodFilter !== 'all') {
      filtered = filtered.filter(entry => entry.subjects?.period === parseInt(periodFilter));
    }
    if (date?.from) {
      const fromDate = new Date(date.from);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(entry => new Date(entry.created_at) >= fromDate);
    }
    if (date?.to) {
      const toDate = new Date(date.to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(entry => new Date(entry.created_at) <= toDate);
    }
    
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return filtered;
  }, [feedbackEntries, statusFilter, ratingFilter, batchFilter, semesterFilter, subjectFilter, periodFilter, date]);

  const selectedFeedback = useMemo(() => {
    return feedbackEntries.find(f => f.id === selectedFeedbackId) || null;
  }, [selectedFeedbackId, feedbackEntries]);

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
                  <p className="font-semibold">
                    {feedback.profiles?.first_name || 'Student'} {feedback.profiles?.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(feedback.created_at).toLocaleString()}
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
              Filters
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <SelectItem key={sem} value={sem.toString()}>{`Semester ${sem}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={subjectFilter} onValueChange={setSubjectFilter} disabled={subjectsLoading}> {/* New Subject Filter */}
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Subject..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>{subject.name} {subject.period ? `(P${subject.period})` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Period..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {Array.from({ length: 7 }, (_, i) => i + 1).map(p => (
                    <SelectItem key={p} value={p.toString()}>{`Period ${p}`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="flex flex-col gap-8 px-6 pb-6">
        <FeedbackTrends batchId={batchFilter === 'all' ? undefined : batchFilter} semesterNumber={semesterFilter === 'all' ? undefined : parseInt(semesterFilter)} />
        <Separator />
        <FeedbackBreakdown batchId={batchFilter === 'all' ? undefined : batchFilter} semesterNumber={semesterFilter === 'all' ? undefined : parseInt(semesterFilter)} />
        <Separator />
      </div>

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