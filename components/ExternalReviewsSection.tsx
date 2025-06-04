import React, { useState, useEffect } from 'react';
import FirestoreClient, { ReviewData } from '../lib/firestoreClient';

interface ExternalReviewsSectionProps {
  clinicId: string;
  className?: string;
}

const ExternalReviewsSection: React.FC<ExternalReviewsSectionProps> = ({ 
  clinicId,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'google' | 'healthgrades'>('all');
  const [reviews, setReviews] = useState<Record<string, ReviewData[]>>({
    all: [],
    google: [],
    healthgrades: []
  });
  const [loading, setLoading] = useState(true);

  // Fetch reviews for the clinic
  useEffect(() => {
    const fetchReviews = async () => {
      if (!clinicId) return;

      setLoading(true);
      
      try {
        // Get all reviews
        const allReviews = await FirestoreClient.getClinicReviews(clinicId);
        
        // Organize by source
        const googleReviews = allReviews.filter(review => review.source === 'google');
        const healthgradesReviews = allReviews.filter(review => review.source === 'healthgrades');
        
        setReviews({
          all: allReviews,
          google: googleReviews,
          healthgrades: healthgradesReviews
        });
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [clinicId]);

  // Get currently active reviews based on tab
  const activeReviews = reviews[activeTab] || [];
  
  // Format date for display
  const formatDate = (date: Date | any) => {
    try {
      // Convert Firebase timestamp to Date if needed
      const dateObj = date instanceof Date ? date : (date?.toDate ? date.toDate() : new Date(date));
      return new Intl.DateTimeFormat('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      }).format(dateObj);
    } catch (e) {
      return 'Unknown Date';
    }
  };
  
  // Render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex text-yellow-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg 
            key={star} 
            className="w-5 h-5" 
            fill={star <= Math.round(rating) ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ))}
      </div>
    );
  };

  // Get the source icon
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'google':
        return <img src="/images/icons/google-icon.svg" alt="Google" className="w-5 h-5" />;
      case 'healthgrades':
        return <span className="w-5 h-5 font-bold text-blue-500 text-xs">HG</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">Patient Reviews</h2>
          {reviews.all.length > 0 && (
            <div className="flex space-x-2">
              <span className="text-sm text-gray-500">
                Average: <span className="font-medium text-yellow-600">{
                  (reviews.all.reduce((acc, review) => acc + review.rating, 0) / reviews.all.length).toFixed(1)
                }</span>
              </span>
              <span className="text-sm text-gray-500">
                ({reviews.all.length})
              </span>
            </div>
          )}
        </div>
      </div>
      
      {loading ? (
        <div className="p-6 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-700"></div>
        </div>
      ) : (
        <>
          {reviews.all.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-gray-500 italic">No reviews found for this clinic.</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`py-3 px-4 text-center border-b-2 text-sm font-medium ${
                      activeTab === 'all'
                        ? 'text-indigo-600 border-indigo-600'
                        : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    All Reviews ({reviews.all.length})
                  </button>
                  {reviews.google.length > 0 && (
                    <button
                      onClick={() => setActiveTab('google')}
                      className={`py-3 px-4 text-center border-b-2 text-sm font-medium ${
                        activeTab === 'google'
                          ? 'text-indigo-600 border-indigo-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Google ({reviews.google.length})
                    </button>
                  )}
                  {reviews.healthgrades.length > 0 && (
                    <button
                      onClick={() => setActiveTab('healthgrades')}
                      className={`py-3 px-4 text-center border-b-2 text-sm font-medium ${
                        activeTab === 'healthgrades'
                          ? 'text-indigo-600 border-indigo-600'
                          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Healthgrades ({reviews.healthgrades.length})
                    </button>
                  )}
                </nav>
              </div>
              
              <div className="divide-y divide-gray-200">
                {activeReviews.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 italic">No reviews found for the selected source.</p>
                  </div>
                ) : (
                  activeReviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getSourceIcon(review.source)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <div className="text-sm font-medium text-gray-900">
                              {review.author || 'Anonymous'}
                            </div>
                            <div className="text-xs text-gray-500">{formatDate(review.date)}</div>
                          </div>
                          <div className="mb-2">{renderStars(review.rating)}</div>
                          <div className="text-sm text-gray-700">
                            {review.text || 'No review text available.'}
                          </div>
                          {review.url && (
                            <div className="mt-2">
                              <a 
                                href={review.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-indigo-600 hover:text-indigo-800"
                              >
                                View on {review.source.charAt(0).toUpperCase() + review.source.slice(1)}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {activeReviews.length > 5 && (
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 border-t border-gray-200">
                  <a 
                    href="#" 
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    View all {activeReviews.length} reviews
                  </a>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default ExternalReviewsSection;