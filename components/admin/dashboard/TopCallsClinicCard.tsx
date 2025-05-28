import React from 'react';
import { PhoneIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import { useSeoIndexStatus } from '../../../apps/web/utils/hooks/useSeoIndexStatus';
import { TierBadge } from '../../TierBadge';

interface ClinicCallData {
  id: string;
  name: string;
  callClicks: number;
  avgCallTime?: number;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
  };
  tier: string;
  city: string;
  state: string;
}

export function TopCallsClinicCard() {
  const { clinics, loading, error } = useSeoIndexStatus();
  
  // Mock call data generation for top clinics
  const generateCallData = (): ClinicCallData[] => {
    return clinics
      .slice(0, 15) // Get top 15 clinics
      .map(clinic => {
        const baseCallClicks = Math.floor(Math.random() * 100 + 20);
        const mobilePercent = 70 + Math.floor(Math.random() * 20);
        
        return {
          id: clinic.slug,
          name: clinic.name,
          callClicks: baseCallClicks,
          avgCallTime: 180 + Math.floor(Math.random() * 120), // 3-5 minutes
          deviceBreakdown: {
            mobile: mobilePercent,
            desktop: 100 - mobilePercent
          },
          tier: clinic.tier || 'basic',
          city: clinic.city,
          state: clinic.state
        };
      })
      .sort((a, b) => b.callClicks - a.callClicks)
      .slice(0, 5); // Top 5
  };

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !clinics.length) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Error Loading Call Data</h3>
          <p className="text-sm">{error || 'No clinic data available'}</p>
        </div>
      </div>
    );
  }

  const topCallClinics = generateCallData();
  const totalCalls = topCallClinics.reduce((sum, clinic) => sum + clinic.callClicks, 0);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Top Call Generating Clinics</h3>
          <p className="text-sm text-gray-600">Last 30 days</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{totalCalls}</div>
          <div className="text-sm text-gray-600">Total Calls</div>
        </div>
      </div>

      <div className="space-y-4">
        {topCallClinics.map((clinic, index) => (
          <div key={clinic.id} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{clinic.name}</h4>
                    <p className="text-sm text-gray-600">{clinic.city}, {clinic.state}</p>
                  </div>
                  <TierBadge tier={clinic.tier} />
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                {/* Call Stats */}
                <div className="text-center">
                  <div className="flex items-center text-orange-600 mb-1">
                    <PhoneIcon className="h-4 w-4 mr-1" />
                    <span className="font-bold">{clinic.callClicks}</span>
                  </div>
                  <div className="text-xs text-gray-500">calls</div>
                </div>

                {/* Average Call Time */}
                {clinic.avgCallTime && (
                  <div className="text-center">
                    <div className="font-bold text-gray-900">
                      {formatCallTime(clinic.avgCallTime)}
                    </div>
                    <div className="text-xs text-gray-500">avg time</div>
                  </div>
                )}

                {/* Device Breakdown */}
                <div className="text-center">
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex items-center text-purple-600">
                      <DevicePhoneMobileIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{clinic.deviceBreakdown.mobile}%</span>
                    </div>
                    <div className="flex items-center text-purple-400">
                      <ComputerDesktopIcon className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">{clinic.deviceBreakdown.desktop}%</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">mobile / desktop</div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(clinic.callClicks / topCallClinics[0].callClicks) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Top 5 of {clinics.length} total clinics
          </span>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            View All Clinics →
          </button>
        </div>
      </div>
    </div>
  );
}