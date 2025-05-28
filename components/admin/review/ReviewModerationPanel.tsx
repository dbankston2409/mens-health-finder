import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { FlagIcon, CheckIcon, XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

interface Review {
  id: string;
  clinicSlug: string;
  clinicName: string;
  rating: number;
  text: string;
  displayName: string;
  isAnonymous: boolean;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flagReason?: string;
  moderatorNotes?: string;
  reportCount: number;
  helpfulCount: number;
  source: string;
  ipAddress: string;
}

interface FilterOptions {
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'flagged';
  rating: 'all' | 'low' | 'high';
  clinic: string;
  flaggedKeywords: boolean;
}

export default function ReviewModerationPanel() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'pending',
    rating: 'all',
    clinic: 'all',
    flaggedKeywords: false
  });
  const [selectedReviews, setSelectedReviews] = useState<string[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [clinics, setClinics] = useState<any[]>([]);

  useEffect(() => {
    fetchReviews();
    fetchClinics();
  }, [filters]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== 'all' && value !== false) {
          params.append(key, value.toString());
        }
      });
      
      const response = await fetch(`/api/admin/reviews?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const response = await fetch('/api/admin/clinics?limit=1000');
      const data = await response.json();
      
      if (data.success) {
        setClinics(data.clinics || []);
      }
    } catch (error) {
      console.error('Error fetching clinics:', error);
    }
  };

  const handleStatusChange = async (reviewId: string, newStatus: string, notes?: string) => {
    try {
      const response = await fetch('/api/admin/review/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          status: newStatus,
          moderatorNotes: notes
        })
      });
      
      if (response.ok) {
        setReviews(reviews.map(review => 
          review.id === reviewId 
            ? { ...review, status: newStatus as any, moderatorNotes: notes }
            : review
        ));
      } else {
        alert('Failed to update review status');
      }
    } catch (error) {
      console.error('Error updating review status:', error);
      alert('Error updating review status');
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedReviews.length === 0) {
      alert('Please select reviews first');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/reviews/bulk-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewIds: selectedReviews,
          action
        })
      });
      
      if (response.ok) {
        fetchReviews(); // Refresh data
        setSelectedReviews([]);
      } else {
        alert('Failed to perform bulk action');
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Error performing bulk action');
    }
  };

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      alert('Please enter a reply');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/review/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          replyText: replyText.trim()
        })
      });
      
      if (response.ok) {
        setReplyingTo(null);
        setReplyText('');
        alert('Reply posted successfully');
      } else {
        alert('Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      alert('Error posting reply');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      flagged: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRatingColor = (rating: number) => {
    if (rating <= 2) return 'text-red-500';
    if (rating <= 3) return 'text-yellow-500';
    return 'text-green-500';
  };

  const hasFlag gedKeywords = (text: string): boolean => {
    const flaggedWords = ['fake', 'scam', 'terrible', 'worst', 'horrible', 'awful'];
    return flaggedWords.some(word => text.toLowerCase().includes(word));
  };

  const filteredReviews = reviews.filter(review => {
    if (filters.rating === 'low' && review.rating > 3) return false;
    if (filters.rating === 'high' && review.rating <= 3) return false;
    if (filters.clinic !== 'all' && review.clinicSlug !== filters.clinic) return false;
    if (filters.flaggedKeywords && !hasFlaggedKeywords(review.text)) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header and Filters */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Review Moderation</h2>
          <div className="flex space-x-2">
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value as any})}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="flagged">Flagged</option>
            </select>
            
            <select
              value={filters.rating}
              onChange={(e) => setFilters({...filters, rating: e.target.value as any})}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">All Ratings</option>
              <option value="low">Low (≤3)</option>
              <option value="high">High (>3)</option>
            </select>
            
            <select
              value={filters.clinic}
              onChange={(e) => setFilters({...filters, clinic: e.target.value})}
              className="text-sm border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">All Clinics</option>
              {clinics.map(clinic => (
                <option key={clinic.slug} value={clinic.slug}>
                  {clinic.name}
                </option>
              ))}
            </select>
            
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={filters.flaggedKeywords}
                onChange={(e) => setFilters({...filters, flaggedKeywords: e.target.checked})}
                className="mr-2"
              />
              Flagged Keywords
            </label>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedReviews.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">
                {selectedReviews.length} review(s) selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  Approve All
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Reject All
                </button>
                <button
                  onClick={() => handleBulkAction('flag')}
                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                >
                  Flag All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="divide-y divide-gray-200">
        {filteredReviews.length === 0 ? (
          <div className="p-8 text-center">
            <StarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No reviews found</p>
            <p className="text-sm text-gray-400 mt-1">
              Try adjusting your filters to see more reviews
            </p>
          </div>
        ) : (
          filteredReviews.map((review) => (
            <div key={review.id} className="p-6">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedReviews.includes(review.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedReviews([...selectedReviews, review.id]);
                    } else {
                      setSelectedReviews(selectedReviews.filter(id => id !== review.id));
                    }
                  }}
                  className="mt-1"
                />
                
                <div className="flex-1">
                  {/* Review Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon
                            key={star}
                            className={`h-4 w-4 ${
                              star <= review.rating ? getRatingColor(review.rating) : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-medium text-gray-900">
                        {review.displayName}
                      </span>
                      {review.isAnonymous && (
                        <span className="text-xs text-gray-500">(Anonymous)</span>
                      )}
                      <span className="text-sm text-gray-500">
                        for {review.clinicName}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(review.status)}
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Review Content */}
                  <div className="mb-4">
                    <p className="text-gray-700 mb-2">{review.text}</p>
                    
                    {hasFlaggedKeywords(review.text) && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-2 text-sm text-orange-800">
                        ⚠️ Contains potentially flagged keywords
                      </div>
                    )}
                    
                    {review.reportCount > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-800">
                        🚨 Reported {review.reportCount} time(s)
                      </div>
                    )}
                  </div>
                  
                  {/* Review Meta */}
                  <div className="text-xs text-gray-500 mb-4">
                    Source: {review.source} | IP: {review.ipAddress} | 
                    Helpful: {review.helpfulCount} | Reports: {review.reportCount}
                  </div>
                  
                  {/* Moderator Notes */}
                  {review.moderatorNotes && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                      <div className="text-xs font-medium text-gray-700 mb-1">Moderator Notes:</div>
                      <div className="text-sm text-gray-600">{review.moderatorNotes}</div>
                    </div>
                  )}
                  
                  {/* Reply Section */}
                  {replyingTo === review.id && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply..."
                        rows={3}
                        className="w-full p-2 border border-gray-300 rounded text-sm"
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReply(review.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Post Reply
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-3">
                    {review.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusChange(review.id, 'approved')}
                          className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Rejection reason (optional):');
                            handleStatusChange(review.id, 'rejected', reason || undefined);
                          }}
                          className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Reject
                        </button>
                      </>
                    )}
                    
                    <button
                      onClick={() => {
                        const reason = prompt('Flag reason:');
                        if (reason) handleStatusChange(review.id, 'flagged', reason);
                      }}
                      className="inline-flex items-center px-3 py-1 bg-orange-600 text-white text-sm rounded hover:bg-orange-700"
                    >
                      <FlagIcon className="h-4 w-4 mr-1" />
                      Flag
                    </button>
                    
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                      Reply
                    </button>
                    
                    {review.status !== 'pending' && (
                      <button
                        onClick={() => handleStatusChange(review.id, 'pending')}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Reset to Pending
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Pagination could be added here */}
      <div className="border-t border-gray-200 p-4 text-center text-sm text-gray-500">
        Showing {filteredReviews.length} of {reviews.length} reviews
      </div>
    </div>
  );
}