"use client";

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStudentFeedbackHistory } from '@/hooks/useStudentFeedbackHistory';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import RatingStars from './RatingStars';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'; // Import DialogDescription
import { FeedbackHistoryEntry } from '@/types/supabase';
import { Separator } from './ui/separator';
import { supabase } from '@/integrations/supabase/client';

const PAGE_SIZE = 5;

const StudentFeedbackHistory: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const { feedbackHistory, loading, totalCount, markAsSeen, refetch } = useStudentFeedbackHistory(currentPage, PAGE_SIZE);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackHistoryEntry | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // This effect handles deep linking from notifications
  useEffect(() => {
    const feedbackIdToOpen = location.state?.feedbackId;
    if (!feedbackIdToOpen || loading) return;

    const openFeedbackDialog = async (feedbackItem: FeedbackHistoryEntry) => {
      setSelectedFeedback(feedbackItem);
      setIsDialogOpen(true);
      if (feedbackItem.admin_response && !feedbackItem.is_response_seen_by_student) {
        await markAsSeen(feedbackItem.id);
        refetch(); // Refetch to update the UI (e.g., remove blue dot)
      }
    };

    const findAndOpenFeedback = async () => {
      const feedbackOnCurrentPage = feedbackHistory.find(f => f.id === feedbackIdToOpen);

      if (feedbackOnCurrentPage) {
        openFeedbackDialog(feedbackOnCurrentPage);
      } else {
        // If not on the current page, fetch it directly
        const { data, error } = await supabase
          .from('feedback')
          .select(`
            id, student_id, class_id, batch_id, semester_number, rating, comment, admin_response, created_at, is_response_seen_by_student,
            subjects(name)
          `)
          .eq('id', feedbackIdToOpen)
          .single();
        
        if (data && !error) {
          openFeedbackDialog(data as FeedbackHistoryEntry);
        }
      }
      // Clear the location state to prevent re-triggering
      navigate(location.pathname, { replace: true, state: {} });
    };

    findAndOpenFeedback();

  }, [location.state, feedbackHistory, loading, navigate, markAsSeen, refetch]);

  const pageCount = Math.ceil(totalCount / PAGE_SIZE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pageCount) {
      setCurrentPage(page);
    }
  };

  const handleRowClick = (feedback: FeedbackHistoryEntry) => {
    setSelectedFeedback(feedback);
    setIsDialogOpen(true);
    if (feedback.admin_response && !feedback.is_response_seen_by_student) {
      markAsSeen(feedback.id);
    }
  };
  
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Delay clearing to allow for exit animation
      setTimeout(() => setSelectedFeedback(null), 300);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Your Feedback History</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : feedbackHistory.length === 0 ? (
          <p className="text-center">You haven't submitted any feedback yet.</p>
        ) : (
          <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead> {/* Renamed from Class */}
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedbackHistory.map((feedback) => (
                  <TableRow key={feedback.id} onClick={() => handleRowClick(feedback)} className="cursor-pointer">
                    <TableCell>
                      <div className="flex items-center">
                        {feedback.admin_response && !feedback.is_response_seen_by_student && (
                          <span className="mr-2 h-2 w-2 rounded-full bg-blue-500" aria-label="New response"></span>
                        )}
                        {feedback.subjects?.name} {/* Renamed from classes?.name */}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(feedback.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <RatingStars rating={feedback.rating} starClassName="inline-block" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {selectedFeedback && (
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Feedback for {selectedFeedback.subjects?.name}</DialogTitle> {/* Renamed from classes?.name */}
                  <DialogDescription>Details of your feedback submission and administrator's response.</DialogDescription> {/* Added DialogDescription */}
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">{new Date(selectedFeedback.created_at).toLocaleString()}</p>
                    <RatingStars rating={selectedFeedback.rating} />
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Your Comment:</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md min-h-[60px]">
                      {selectedFeedback.comment || "You did not leave a comment."}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Administrator's Response:</h4>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md min-h-[60px]">
                      {selectedFeedback.admin_response || "No response from the administrator yet."}
                    </p>
                  </div>
                </div>
              </DialogContent>
            )}
          </Dialog>
        )}
        {pageCount > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); handlePageChange(page); }}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }}
                  className={currentPage === pageCount ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
};

export default StudentFeedbackHistory;