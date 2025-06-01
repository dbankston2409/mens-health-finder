import React from 'react';
import { Clinic } from '../apps/web/types';

interface ClinicSnapshotProps {
  clinic: Clinic;
  className?: string;
}

const ClinicSnapshot: React.FC<ClinicSnapshotProps> = ({ clinic, className = '' }) => {
  // If no snapshot exists, show nothing
  if (!clinic.snapshot) {
    return null;
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-lg my-5 shadow-sm ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="text-blue-500 flex-shrink-0 mt-1">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Clinic Overview
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            {clinic.snapshot}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClinicSnapshot;