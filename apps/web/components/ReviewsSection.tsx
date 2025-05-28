import React from 'react';
import Link from 'next/link';

interface Review {
  source: string;
  author: string;
  rating: number;
  text: string;
  date?: string;
}

interface ReviewsSectionProps {
  clinicId: number;
  clinicName: string;
  reviews: Review[];
  showWriteReview?: boolean;
}

const ReviewsSection: React.FC<ReviewsSectionProps> = ({ 
  clinicId, 
  clinicName, 
  reviews, 
  showWriteReview = true 
}) => {
  // Separate native MHF reviews from external reviews
  const nativeReviews = reviews?.filter(review => review.source === 'MHF') || [];
  const googleReviews = reviews?.filter(review => review.source === 'Google') || [];
  const yelpReviews = reviews?.filter(review => review.source === 'Yelp') || [];
  
  // Calculate average ratings
  const calculateAvgRating = (reviews: Review[]) => {
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  };
  
  const nativeRating = calculateAvgRating(nativeReviews);
  const nativeReviewCount = nativeReviews.length;
  
  const hasExternalReviews = googleReviews.length > 0 || yelpReviews.length > 0;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Reviews</h2>
        {nativeReviewCount > 0 && (
          <div className="flex items-center">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-5 h-5" fill={star <= Math.floor(nativeRating) ? 'currentColor' : 'none'} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="ml-2 text-textSecondary">{nativeRating.toFixed(1)} ({nativeReviewCount} reviews)</span>
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
                    <p className="font-bold">{review.author}</p>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-4 h-4" fill={star <= review.rating ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      {review.date && (
                        <span className="text-textSecondary text-sm">{review.date}</span>
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
                    <p className="font-bold">{review.author}</p>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-4 h-4" fill={star <= review.rating ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
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
      
      {/* Yelp Reviews Section */}
      {yelpReviews.length > 0 && (
        <div className="mb-10">
          <div className="flex items-center mb-4">
            <div className="w-6 h-6 mr-2 flex items-center justify-center bg-transparent">
              <img 
                src="/images/icons/yelpicontrans.png" 
                alt="Yelp" 
                className="w-5 h-5" 
              />
            </div>
            <h4 className="font-bold">Yelp Reviews</h4>
          </div>
          
          <div className="space-y-6">
            {yelpReviews.map((review, index) => (
              <div key={`yelp-${index}`} className="bg-gray-900 rounded-xl p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold">{review.author}</p>
                    <div className="flex items-center">
                      <div className="flex text-yellow-400 mr-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg key={star} className="w-4 h-4" fill={star <= review.rating ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <p>{review.text}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4">
            <a 
              href={`https://www.yelp.com/biz/${clinicName.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-red-400 flex items-center"
            >
              See all Yelp reviews
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      )}
      
      {/* Write a Review Section */}
      {showWriteReview && (
        <div className="mb-10 bg-gray-900 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Submit Your Review</h3>
          <p className="text-textSecondary mb-4">
            Share your experience with {clinicName} to help others make informed decisions about their healthcare.
          </p>
          <Link href={`/review/create/${clinicId}`} className="btn">
            Write a Review
          </Link>
        </div>
      )}
    </div>
  );
};

export default ReviewsSection;