import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';

interface ReviewFormProps {
  clinicSlug: string;
  clinicName?: string;
  onSuccess?: (reviewId: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface ReviewData {
  rating: number;
  text: string;
  displayName: string;
  anonymous: boolean;
}

export default function ReviewForm({
  clinicSlug,
  clinicName,
  onSuccess,
  onCancel,
  className = ''
}: ReviewFormProps) {
  const router = useRouter();
  const [reviewData, setReviewData] = useState<ReviewData>({
    rating: 0,
    text: '',
    displayName: '',
    anonymous: false
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinic, setClinic] = useState<any>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchClinicInfo();
  }, [clinicSlug]);

  useEffect(() => {
    // Auto-save draft to localStorage
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer);
    }
    
    const timer = setTimeout(() => {
      if (reviewData.rating > 0 || reviewData.text.trim()) {
        localStorage.setItem(`review-draft-${clinicSlug}`, JSON.stringify(reviewData));
      }
    }, 1000);
    
    setAutoSaveTimer(timer);
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [reviewData, clinicSlug]);

  useEffect(() => {
    // Load saved draft
    const savedDraft = localStorage.getItem(`review-draft-${clinicSlug}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setReviewData(draft);
      } catch (error) {
        console.error('Error loading review draft:', error);
      }
    }
  }, [clinicSlug]);

  const fetchClinicInfo = async () => {
    try {
      const clinicRef = doc(db, 'clinics', clinicSlug);
      const clinicDoc = await getDoc(clinicRef);
      
      if (clinicDoc.exists()) {
        setClinic(clinicDoc.data());
      }
    } catch (error) {
      console.error('Error fetching clinic info:', error);
    }
  };

  const handleRatingChange = (rating: number) => {
    setReviewData(prev => ({ ...prev, rating }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setReviewData(prev => ({ ...prev, [name]: checked }));
    } else {
      setReviewData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateReview = (): boolean => {
    if (reviewData.rating === 0) {
      setError('Please select a rating');
      return false;
    }
    
    if (reviewData.text.trim().length < 10) {
      setError('Please write at least 10 characters about your experience');
      return false;
    }
    
    if (!reviewData.anonymous && !reviewData.displayName.trim()) {
      setError('Please enter your name or choose to post anonymously');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateReview()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const reviewDoc = {
        clinicSlug,
        clinicName: clinic?.name || clinicName || 'Unknown Clinic',
        rating: reviewData.rating,
        text: reviewData.text.trim(),
        displayName: reviewData.anonymous ? 'Anonymous' : reviewData.displayName.trim(),
        isAnonymous: reviewData.anonymous,
        createdAt: serverTimestamp(),
        status: 'pending', // For moderation
        helpfulCount: 0,
        reportCount: 0,
        source: 'website',
        verified: false, // Could be true if user authenticated
        ipAddress: await getClientIP(),
        userAgent: navigator.userAgent
      };
      
      const reviewsRef = collection(db, 'reviews');
      const docRef = await addDoc(reviewsRef, reviewDoc);
      
      // Clear the draft
      localStorage.removeItem(`review-draft-${clinicSlug}`);
      
      // Track analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', 'review_submit', {
          clinic_slug: clinicSlug,
          rating: reviewData.rating,
          anonymous: reviewData.anonymous
        });
      }
      
      // Track lead session event
      await trackLeadEvent('review-submitted', {
        reviewId: docRef.id,
        clinicSlug,
        rating: reviewData.rating
      });
      
      setSubmitted(true);
      
      if (onSuccess) {
        onSuccess(docRef.id);
      }
      
      // Redirect after delay
      setTimeout(() => {
        router.push(`/clinic/${clinicSlug}?reviewed=true`);
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting review:', error);
      setError('Failed to submit review. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingText = (rating: number): string => {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  const getPlaceholderText = (rating: number): string => {
    if (rating <= 2) {
      return 'What could have been better? Your feedback helps others and helps the clinic improve.';
    } else if (rating === 3) {
      return 'Tell us about your experience. What went well and what could be improved?';
    } else {
      return 'What made your experience positive? Help others know what to expect.';
    }
  };

  if (submitted) {
    return (
      <div className={`max-w-2xl mx-auto ${className}`}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-green-600 text-4xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-800 mb-4">
            Thank you for your review!
          </h2>
          <p className="text-green-700 mb-6">
            Your review of {clinic?.name || clinicName} has been submitted and will be published after a quick review.
          </p>
          <div className="bg-white rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-6 w-6 ${star <= reviewData.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
              <span className="ml-2 font-medium">{getRatingText(reviewData.rating)}</span>
            </div>
            <p className="text-sm text-gray-600 italic">"{reviewData.text}"</p>
            <p className="text-xs text-gray-500 mt-2">
              - {reviewData.anonymous ? 'Anonymous' : reviewData.displayName}
            </p>
          </div>
          <div className="text-sm text-green-600 space-y-1">
            <p>✓ Review submitted successfully</p>
            <p>✓ Clinic has been notified</p>
            <p>✓ Your review helps the community</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Write a Review
          </h2>
          {clinic && (
            <p className="text-gray-600">
              Share your experience with{' '}
              <span className="font-medium">{clinic.name}</span>
              {clinic.city && clinic.state && (
                <span className="text-gray-500"> in {clinic.city}, {clinic.state}</span>
              )}
            </p>
          )}
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Overall Rating *
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="focus:outline-none"
                >
                  {star <= reviewData.rating ? (
                    <StarIcon className="h-8 w-8 text-yellow-400 hover:text-yellow-500 transition-colors" />
                  ) : (
                    <StarOutlineIcon className="h-8 w-8 text-gray-300 hover:text-yellow-300 transition-colors" />
                  )}
                </button>
              ))}
              <span className="ml-3 text-lg font-medium text-gray-700">
                {getRatingText(reviewData.rating)}
              </span>
            </div>
          </div>
          
          {/* Review Text */}
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
              Your Experience *
            </label>
            <textarea
              id="text"
              name="text"
              value={reviewData.text}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              placeholder={getPlaceholderText(reviewData.rating)}
              required
            />
            <div className="mt-1 text-xs text-gray-500">
              {reviewData.text.length}/500 characters
            </div>
          </div>
          
          {/* Display Name */}
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={reviewData.displayName}
              onChange={handleInputChange}
              disabled={reviewData.anonymous}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              placeholder="How should we display your name?"
            />
          </div>
          
          {/* Anonymous Option */}
          <div className="flex items-center">
            <input
              id="anonymous"
              name="anonymous"
              type="checkbox"
              checked={reviewData.anonymous}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="anonymous" className="ml-2 block text-sm text-gray-700">
              Post this review anonymously
            </label>
          </div>
          
          {/* Submit Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting || reviewData.rating === 0}
              className="flex-1 bg-blue-600 text-white font-medium py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
            
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
          
          <div className="text-xs text-gray-500 text-center pt-2">
            <p>
              Your review will be published after a quick moderation review. 
              We reserve the right to remove reviews that violate our community guidelines.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// Helper functions
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || 'unknown';
  } catch {
    return 'unknown';
  }
}

async function trackLeadEvent(action: string, data: any): Promise<void> {
  try {
    const { trackSessionEvent } = await import('../utils/hooks/AnonymousLeadSession');
    await trackSessionEvent(action, data);
  } catch (error) {
    console.error('Error tracking lead event:', error);
  }
}