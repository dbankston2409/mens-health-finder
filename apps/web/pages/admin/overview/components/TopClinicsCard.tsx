import React from 'react';
import Link from 'next/link';
import { ArrowPathIcon, StarIcon, ArrowTopRightOnSquareIcon, MapPinIcon } from '@heroicons/react/24/solid';

interface TopClinic {
  clinicId: string;
  clinicName: string;
  totalViews: number;
  viewsThisMonth: number;
  lastViewed: Date | null;
}

interface TopClinicsCardProps {
  data: TopClinic[] | null;
  loading: boolean;
  onRefresh: () => void;
}

const TopClinicsCard: React.FC<TopClinicsCardProps> = ({ data, loading, onRefresh }) => {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-[#111111] rounded-2xl shadow-lg border border-[#222222] p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <StarIcon className="h-6 w-6 text-yellow-500 mr-2" />
          <h2 className="text-xl font-semibold text-white">Top Clinics</h2>
        </div>
        
        <button 
          onClick={onRefresh}
          className="text-gray-400 hover:text-gray-300"
          title="Refresh data"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>
      
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-gray-400">
            No clinic data available. Try refreshing.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((clinic, index) => (
            <div 
              key={clinic.clinicId}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-900 text-blue-200 text-sm font-semibold mr-2">
                      {index + 1}
                    </div>
                    <h3 className="text-md font-medium text-white">
                      {clinic.clinicName}
                    </h3>
                  </div>
                  
                  <div className="mt-1 flex items-center text-sm text-gray-400">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    <span>Location data not available</span>
                  </div>
                </div>
                
                <Link href={`/admin/clinic/${clinic.clinicId}`} className="text-blue-400 hover:text-blue-300">
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                </Link>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#111111] rounded p-2">
                  <div className="text-gray-400">Total Views</div>
                  <div className="font-semibold text-white">{clinic.totalViews.toLocaleString()}</div>
                </div>
                
                <div className="bg-[#111111] rounded p-2">
                  <div className="text-gray-400">Views This Month</div>
                  <div className="font-semibold text-white">{clinic.viewsThisMonth.toLocaleString()}</div>
                </div>
                
                <div className="bg-[#111111] rounded p-2 col-span-2">
                  <div className="text-gray-400">Last Viewed</div>
                  <div className="font-semibold text-white">{formatDate(clinic.lastViewed)}</div>
                </div>
              </div>
            </div>
          ))}
          
          <div className="text-center pt-2">
            <Link href="/admin/crm" className="text-sm text-blue-400 hover:underline">
              View all clinics
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopClinicsCard;