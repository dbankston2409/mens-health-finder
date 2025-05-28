import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTopClinicsByCallVolume } from '../../../utils/callTracking';
import { PhoneIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface TopCallsClinicCardProps {
  limit?: number;
  timeRange?: number;
  className?: string;
}

const TopCallsClinicCard: React.FC<TopCallsClinicCardProps> = ({ 
  limit = 5, 
  timeRange = 30,
  className = ''
}) => {
  const [topClinics, setTopClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchTopClinics = async () => {
      setLoading(true);
      try {
        const clinics = await getTopClinicsByCallVolume(limit, timeRange);
        setTopClinics(clinics);
      } catch (err) {
        console.error('Error fetching top clinics by calls:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopClinics();
  }, [limit, timeRange]);
  
  if (loading) {
    return (
      <div className={`bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-800 rounded w-1/2 mb-6"></div>
          {Array.from({ length: limit }).map((_, index) => (
            <div key={index} className="flex items-center justify-between mt-4">
              <div>
                <div className="h-4 bg-gray-800 rounded w-40 mb-2"></div>
                <div className="h-3 bg-gray-800 rounded w-24"></div>
              </div>
              <div className="h-6 bg-gray-800 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-medium mb-4">Top Clinics by Phone Leads</h3>
        <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-300 px-4 py-3 rounded-md">
          <p>Failed to load top clinics data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium">Top Clinics by Phone Leads</h3>
        <PhoneIcon className="h-5 w-5 text-primary" />
      </div>
      
      {topClinics.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-gray-500">No call data available for the selected time period</p>
        </div>
      ) : (
        <div className="space-y-4">
          {topClinics.map((clinic, index) => (
            <Link
              key={index}
              href={`/admin/clinic/${clinic.id}`}
              className="flex items-center justify-between p-3 hover:bg-[#191919] rounded-lg transition-colors group"
            >
              <div>
                <div className="flex items-center">
                  <span className="text-primary font-bold mr-2">#{index + 1}</span>
                  <span className="font-medium">{clinic.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {clinic.city}, {clinic.state}
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center bg-[#222222] px-2 py-1 rounded mr-2">
                  <PhoneIcon className="h-3 w-3 text-primary mr-1" />
                  <span className="text-sm font-medium">{clinic.callCount}</span>
                </div>
                <ChevronRightIcon className="h-4 w-4 text-gray-500 group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-[#222222]">
        <p className="text-xs text-gray-500">
          Call metrics for the last {timeRange} days
        </p>
      </div>
    </div>
  );
};

export default TopCallsClinicCard;