import React, { useState, useEffect } from 'react';
import { ReviewUpdateService, ReviewUpdateResult } from '../../../utils/discovery/reviewUpdateService';

interface ReviewUpdatePanelProps {
  discoverySessionId?: string;
  clinicIds?: string[];
  onUpdateComplete?: (results: ReviewUpdateResult[]) => void;
}

const ReviewUpdatePanel: React.FC<ReviewUpdatePanelProps> = ({
  discoverySessionId,
  clinicIds,
  onUpdateComplete
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0, current: '' });
  const [results, setResults] = useState<ReviewUpdateResult[] | null>(null);
  const [config, setConfig] = useState({
    enableGoogleReviews: true,
    enableYelpReviews: true,
    maxReviewsPerSource: 10,
    rateLimitMs: 1000
  });

  const reviewService = new ReviewUpdateService(config);

  const startReviewUpdate = async () => {
    if (!discoverySessionId && (!clinicIds || clinicIds.length === 0)) {
      alert('No clinics specified for review update');
      return;
    }

    setIsUpdating(true);
    setResults(null);
    setProgress({ completed: 0, total: 0, current: '' });

    try {
      let updateResults: ReviewUpdateResult[];

      const onProgress = (completed: number, total: number, current: string) => {
        setProgress({ completed, total, current });
      };

      if (discoverySessionId) {
        updateResults = await reviewService.updateDiscoveredClinicReviews(
          discoverySessionId,
          onProgress
        );
      } else if (clinicIds) {
        updateResults = await reviewService.updateMultipleClinicReviews(
          clinicIds,
          onProgress
        );
      } else {
        throw new Error('No valid update target specified');
      }

      setResults(updateResults);
      onUpdateComplete?.(updateResults);

    } catch (error) {
      console.error('Review update failed:', error);
      alert(`Review update failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getUpdateStats = () => {
    if (!results) return null;

    const successful = results.filter(r => r.success).length;
    const totalReviews = results.reduce((sum, r) => sum + r.reviewsImported, 0);
    const googleReviews = results.reduce((sum, r) => sum + (r.sources.google?.imported || 0), 0);
    const yelpReviews = results.reduce((sum, r) => sum + (r.sources.yelp?.imported || 0), 0);
    const errors = results.filter(r => r.error).length;

    return {
      total: results.length,
      successful,
      totalReviews,
      googleReviews,
      yelpReviews,
      errors
    };
  };

  const stats = getUpdateStats();

  return (
    <div className="bg-[#0A0A0A] p-6 rounded-lg border border-[#222222]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Review Update</h3>
        {!isUpdating && (
          <button
            onClick={startReviewUpdate}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
            disabled={isUpdating}
          >
            Update Reviews
          </button>
        )}
      </div>

      {/* Configuration */}
      <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Max Reviews per Source
          </label>
          <input
            type="number"
            value={config.maxReviewsPerSource}
            onChange={(e) => setConfig({...config, maxReviewsPerSource: parseInt(e.target.value)})}
            className="w-full px-3 py-2 bg-[#111111] border border-[#333333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            min="1"
            max="50"
            disabled={isUpdating}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Rate Limit (ms)
          </label>
          <input
            type="number"
            value={config.rateLimitMs}
            onChange={(e) => setConfig({...config, rateLimitMs: parseInt(e.target.value)})}
            className="w-full px-3 py-2 bg-[#111111] border border-[#333333] rounded-md text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            min="100"
            max="5000"
            step="100"
            disabled={isUpdating}
          />
        </div>

        <div className="flex items-center space-x-4 mt-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enableGoogleReviews}
              onChange={(e) => setConfig({...config, enableGoogleReviews: e.target.checked})}
              className="rounded border-gray-600 text-primary bg-[#111111] focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              disabled={isUpdating}
            />
            <span className="ml-2 text-sm text-gray-300">Google</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enableYelpReviews}
              onChange={(e) => setConfig({...config, enableYelpReviews: e.target.checked})}
              className="rounded border-gray-600 text-primary bg-[#111111] focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
              disabled={isUpdating}
            />
            <span className="ml-2 text-sm text-gray-300">Yelp</span>
          </label>
        </div>
      </div>

      {/* Progress */}
      {isUpdating && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Updating Reviews</span>
            <span>{progress.completed} / {progress.total}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: progress.total > 0 ? `${(progress.completed / progress.total) * 100}%` : '0%' }}
            ></div>
          </div>
          {progress.current && (
            <div className="text-xs text-gray-500">
              Current: {progress.current}
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Total Clinics</div>
              <div className="font-semibold text-white">{stats.total}</div>
            </div>
            <div>
              <div className="text-gray-400">Successful</div>
              <div className="font-semibold text-green-400">{stats.successful}</div>
            </div>
            <div>
              <div className="text-gray-400">Total Reviews</div>
              <div className="font-semibold text-white">{stats.totalReviews}</div>
            </div>
            <div>
              <div className="text-gray-400">Errors</div>
              <div className="font-semibold text-red-400">{stats.errors}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Google Reviews</div>
              <div className="font-semibold text-white">{stats.googleReviews}</div>
            </div>
            <div>
              <div className="text-gray-400">Yelp Reviews</div>
              <div className="font-semibold text-white">{stats.yelpReviews}</div>
            </div>
          </div>

          {/* Detailed Results */}
          {results && results.length > 0 && (
            <div className="mt-4">
              <details className="text-sm">
                <summary className="text-gray-300 cursor-pointer mb-2">
                  View Detailed Results ({results.length} clinics)
                </summary>
                <div className="max-h-40 overflow-y-auto space-y-1 text-xs">
                  {results.slice(0, 20).map((result, index) => (
                    <div key={index} className={`p-2 rounded ${result.success ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                      <div className="flex justify-between">
                        <span className="text-gray-300">{result.clinicId.slice(0, 8)}...</span>
                        <span className={result.success ? 'text-green-400' : 'text-red-400'}>
                          {result.success ? `${result.reviewsImported} reviews` : 'Failed'}
                        </span>
                      </div>
                      {result.error && (
                        <div className="text-red-400 mt-1">{result.error}</div>
                      )}
                    </div>
                  ))}
                  {results.length > 20 && (
                    <div className="text-gray-500 text-center">
                      ... and {results.length - 20} more
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="mt-4 p-3 bg-[#111111] rounded border border-[#333333]">
        <div className="text-xs text-gray-400">
          <div className="font-medium mb-1">Review Update Info:</div>
          <div>• Fetches reviews from Google Places and Yelp APIs</div>
          <div>• Automatically deduplicates existing reviews</div>
          <div>• Updates clinic metadata with review counts and ratings</div>
          <div>• Rate limited to prevent API quota issues</div>
          {discoverySessionId && (
            <div>• Updating reviews for discovery session: {discoverySessionId}</div>
          )}
          {clinicIds && (
            <div>• Updating reviews for {clinicIds.length} specified clinics</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewUpdatePanel;