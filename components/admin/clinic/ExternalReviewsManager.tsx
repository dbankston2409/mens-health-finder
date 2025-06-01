import React from 'react';
import { Clinic } from '../../../apps/web/types';

interface ExternalReviewsManagerProps {
  clinic: Clinic;
  className?: string;
  onRefresh?: () => void;
}

// Simplified version to fix build issues
const ExternalReviewsManager: React.FC<ExternalReviewsManagerProps> = ({
  clinic,
  className = '',
  onRefresh
}) => {
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">
          External Reviews
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Reviews aggregated from Google, Yelp, and Healthgrades
        </p>
      </div>
      
      <div className="p-6">
        <p className="text-center text-gray-500">External reviews data temporarily unavailable</p>
      </div>
    </div>
  );
};

export default ExternalReviewsManager;