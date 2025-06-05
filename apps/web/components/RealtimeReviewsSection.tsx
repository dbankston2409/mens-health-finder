import React from 'react';
import Link from 'next/link';
import { useRealtimeReviews } from '../hooks/useRealtimeReviews';

interface RealtimeReviewsSectionProps {
  clinicId: string;
  clinicName: string;
  showWriteReview?: boolean;
}

const RealtimeReviewsSection: React.FC<RealtimeReviewsSectionProps> = ({ 
  clinicId, 
  clinicName, 
  showWriteReview = true 
}) => {
  const { reviews, loading, error } = useRealtimeReviews(clinicId);
  
  // Separate native MHF reviews from external reviews
  const nativeReviews = reviews?.filter((review: any) => review.source === 'MHF') || [];
  const googleReviews = reviews?.filter((review: any) => review.source === 'Google') || [];
  
  const calculateAvgRating = (reviews: any[]) => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-500' : 'text-gray-600'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="glass-card p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6">
        <p className="text-red-500">Error loading reviews</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Reviews</h2>
        {showWriteReview && (
          <Link 
            href={`/review/create/${clinicId}`}
            className="btn-primary text-sm"
          >
            Write a Review
          </Link>
        )}
      </div>

      {/* Reviews Summary */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* MHF Reviews */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Men's Health Finder Reviews</h3>
          {nativeReviews.length > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-bold text-white">
                  {calculateAvgRating(nativeReviews)}
                </span>
                {renderStars(parseFloat(calculateAvgRating(nativeReviews)))}
                <span className="text-gray-400 text-sm">
                  ({nativeReviews.length} {nativeReviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              <div className="space-y-3">
                {nativeReviews.map((review: any) => (
                  <div key={review.id} className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-white">{review.author}</p>
                        {renderStars(review.rating)}
                      </div>
                      {review.date && (
                        <span className="text-xs text-gray-400">
                          {new Date(review.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-300 text-sm">{review.text}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400">No reviews yet. Be the first to review!</p>
          )}
        </div>

        {/* Google Reviews */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="font-semibold text-white mb-3">Google Reviews</h3>
          {googleReviews.length > 0 ? (
            <>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-bold text-white">
                  {calculateAvgRating(googleReviews)}
                </span>
                {renderStars(parseFloat(calculateAvgRating(googleReviews)))}
                <span className="text-gray-400 text-sm">
                  ({googleReviews.length} {googleReviews.length === 1 ? 'review' : 'reviews'})
                </span>
              </div>
              <div className="space-y-3">
                {googleReviews.slice(0, 3).map((review: any, index: number) => (
                  <div key={index} className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-white">{review.author}</p>
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">{review.text}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-400">No Google reviews available</p>
          )}
        </div>
      </div>

      {/* All Reviews */}
      {reviews.length > 0 && (
        <div className="border-t border-gray-700 pt-6">
          <h3 className="font-semibold text-white mb-4">All Reviews</h3>
          <div className="space-y-4">
            {reviews.map((review: any) => (
              <div key={review.id} className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{review.author}</p>
                      <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                        {review.source}
                      </span>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  {review.createdAt && (
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt.toDate()).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-gray-300">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealtimeReviewsSection;