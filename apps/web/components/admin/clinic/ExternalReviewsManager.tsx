import React, { useState } from 'react';
import { Clinic } from '../../../types';
import { useClinicReviews, useReviewStats } from '../../../hooks/useClinicReviews';
import { RefreshCw, Star, ExternalLink, Calendar, User, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface ExternalReviewsManagerProps {
  clinic: Clinic;
  className?: string;
  onRefresh?: () => void;
}

const ExternalReviewsManager: React.FC<ExternalReviewsManagerProps> = ({
  clinic,
  className = '',
  onRefresh
}) => {
  const [selectedSource, setSelectedSource] = useState<'all' | 'google' | 'yelp' | 'healthgrades'>('all');
  const { reviews, loading, error, averageRating, lastUpdated, refetch } = useClinicReviews(
    clinic.id,
    {
      source: selectedSource === 'all' ? undefined : selectedSource,
      limit: 50
    }
  );
  const { stats } = useReviewStats(clinic.id);

  const handleRefresh = async () => {
    refetch();
    if (onRefresh) {
      onRefresh();
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              External Reviews
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {stats.totalReviews} reviews from external platforms
              {lastUpdated && (
                <span className="ml-2">
                  • Last updated {format(lastUpdated, 'MMM d, h:mm a')}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Review Stats */}
      <div className="px-4 py-4 sm:px-6 border-b border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Average Rating</p>
            <div className="mt-1">{renderStars(averageRating)}</div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Reviews</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.totalReviews}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Google Reviews</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{stats.sourceBreakdown.google}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Rating Distribution</p>
            <div className="mt-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center text-xs">
                  <span className="w-3">{rating}</span>
                  <div className="flex-1 ml-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400"
                      style={{
                        width: `${stats.totalReviews ? (stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution] / stats.totalReviews) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="ml-2 w-8 text-right">
                    {stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Source Filter */}
      <div className="px-4 py-3 sm:px-6 border-b border-gray-200">
        <div className="flex space-x-2">
          {(['all', 'google', 'yelp', 'healthgrades'] as const).map((source) => (
            <button
              key={source}
              onClick={() => setSelectedSource(source)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                selectedSource === source
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {source.charAt(0).toUpperCase() + source.slice(1)}
              {source !== 'all' && (
                <span className="ml-1 text-xs">
                  ({stats.sourceBreakdown[source as keyof typeof stats.sourceBreakdown]})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className="px-4 py-4 sm:px-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <p className="text-sm text-red-800">Error loading reviews: {error.message}</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-500">Loading reviews...</p>
          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className="text-center py-8">
            <MessageSquare className="h-8 w-8 text-gray-400 mx-auto" />
            <p className="mt-2 text-sm text-gray-500">No reviews found</p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-500"
            >
              Fetch latest reviews
            </button>
          </div>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {reviews.map((review) => (
              <div key={review.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    {review.profile_photo_url ? (
                      <img
                        src={review.profile_photo_url}
                        alt={review.author_name}
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {review.author_name}
                      </p>
                      <div className="flex items-center mt-1">
                        {renderStars(review.rating)}
                        <span className="ml-2 text-xs text-gray-500">
                          {review.source} • {format(review.time.toDate(), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.author_url && (
                    <a
                      href={review.author_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <p className="mt-3 text-sm text-gray-600">{review.text}</p>
                {review.clinicResponse && (
                  <div className="mt-3 pl-4 border-l-2 border-indigo-200">
                    <p className="text-sm font-medium text-gray-700">Response from {clinic.name}:</p>
                    <p className="mt-1 text-sm text-gray-600">{review.clinicResponse}</p>
                    {review.clinicResponseDate && (
                      <p className="mt-1 text-xs text-gray-500">
                        {format(review.clinicResponseDate.toDate(), 'MMM d, yyyy')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalReviewsManager;