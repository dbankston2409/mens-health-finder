import React from 'react';
import { Clinic } from '../../apps/web/types';

interface AnalyticsPanelProps {
  clinic: Clinic;
  className?: string;
}

// Simplified version to fix build issues
const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ clinic, className = '' }) => {
  return (
    <div className={`bg-white shadow rounded-lg overflow-hidden ${className}`}>
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Analytics Overview</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Performance metrics for this clinic
        </p>
      </div>
      
      <div className="p-6">
        <p className="text-center text-gray-500">Analytics data temporarily unavailable</p>
      </div>
    </div>
  );
};

export default AnalyticsPanel;