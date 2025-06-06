import React from 'react';
import Link from 'next/link';
import { useClinicReviews } from '../hooks/useClinicReviews';
import { Star, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface ReviewsSectionProps {
  clinicId: string;
  clinicName: string;
  reviews?: any[]; // Legacy prop, will be ignored
  showWriteReview?: boolean;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ 
  clinicId, 
  clinicName, 
  reviews: legacyReviews, // Ignored, using hook instead
  showWriteReview = true 
}) => {
  // Fetch reviews from Firestore subcollection
  const { reviews, loading, error, averageRating, totalCount } = useClinicReviews(clinicId);
  
  // Separate native MHF reviews from external reviews
  const nativeReviews = reviews?.filter(review => review.source === 'internal') || [];
  const googleReviews = reviews?.filter(review => review.source === 'google') || [];
  const yelpReviews = reviews?.filter(review => review.source === 'yelp') || [];
  const healthgradesReviews = reviews?.filter(review => review.source === 'healthgrades') || [];
  
  const nativeRating = nativeReviews.length > 0
    ? nativeReviews.reduce((sum, review) => sum + review.rating, 0) / nativeReviews.length
    : 0;
  const nativeReviewCount = nativeReviews.length;
  
  const hasExternalReviews = googleReviews.length > 0 || yelpReviews.length > 0 || healthgradesReviews.length > 0;
  
  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
          <span className="ml-2 text-gray-400">Loading reviews...</span>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="glass-card p-6">
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">Error loading reviews. Please try again later.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Reviews</h2>
        {totalCount > 0 && (
          <div className="flex items-center">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${star <= Math.floor(averageRating) ? 'fill-current' : ''}`}
                />
              ))}
            </div>
            <span className="ml-2 text-textSecondary">{averageRating.toFixed(1)} ({totalCount} reviews)</span>
          </div>
        )}
      </div>
      
      {/* Native MHF Reviews Section */}
      {nativeReviewCount > 0 ? (
        <div className="mb-10">
          <h3 className="text-xl font-bold mb-4">Client Reviews</h3>
          
          <div className="space-y-6">
            {nativeReviews.map((review, index) => (
              <div key={`mhf-${index}`} className="bg-gray-900 rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">{review.author_name}</p>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : ''}`}
                          />
                        ))}
                      </div>
                      {review.time && (
                        <span className="text-textSecondary text-sm">
                          {format(review.time.toDate(), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p>{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      ) : showWriteReview ? (
        <div className="mb-10 p-6 bg-gray-900 rounded-xl text-center">
          <p className="mb-4">No client reviews yet. Be the first to share your experience!</p>
        </div>
      ) : null}
      
      {/* External Reviews Header */}
      {hasExternalReviews && (
        <div className="mb-6 mt-10">
          <div className="flex items-center">
            <h3 className="text-xl font-bold">Verified External Reviews</h3>
            <span className="ml-3 text-xs bg-gray-700 text-white px-2 py-1 rounded">
              Updated Monthly
            </span>
          </div>
          <p className="text-textSecondary mt-1">
            These reviews are syndicated from third-party platforms and updated monthly.
          </p>
        </div>
      )}
      
      {/* Google Reviews Section */}
      {googleReviews.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 mr-2 flex items-center justify-center">
              <img 
                src="/images/icons/google-icon.svg" 
                alt="Google" 
                className="w-5 h-5" 
              />
            </div>
            <h4 className="font-bold">Google Reviews</h4>
          </div>
          
          <div className="space-y-6">
            {googleReviews.map((review, index) => (
              <div key={`google-${index}`} className="bg-gray-900 rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">{review.author_name}</p>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : ''}`}
                          />
                        ))}
                      </div>
                      {review.time && (
                        <span className="text-textSecondary text-sm">
                          {format(review.time.toDate(), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <p>{review.text}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <a 
              href={`https://www.google.com/search?q=${encodeURIComponent(clinicName)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-red-400 flex items-center"
            >
              See all Google reviews
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}
      
      
      {/* Write a Review Section */}
      {showWriteReview && (
        <div className="mt-8 bg-gray-800 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 text-white">Submit Your Review</h3>
          <p className="text-textSecondary mb-4">
            Share your experience with {clinicName} to help others make informed decisions about their healthcare.
          </p>
          <Link href={`/review/create/${clinicId}`} className="btn-primary">
            Write a Review
          </Link>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;