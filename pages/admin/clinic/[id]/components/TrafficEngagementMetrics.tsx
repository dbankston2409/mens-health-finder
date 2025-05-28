import React from 'react';
import { useClinicTrafficReport } from '../../../../../utils/hooks/useClinicTrafficReport';
import { PhoneIcon, EyeIcon, DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';

interface TrafficEngagementMetricsProps {
  clinicId: string;
}

export function TrafficEngagementMetrics({ clinicId }: TrafficEngagementMetricsProps) {
  const { data, loading, error } = useClinicTrafficReport(clinicId);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Error Loading Traffic Data</h3>
          <p className="text-sm">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const topAction = data.actions && data.actions.length > 0 
    ? data.actions.reduce((max, action) => action.count > max.count ? action : max)
    : null;

  const topQuery = data.searchTerms && data.searchTerms.length > 0
    ? data.searchTerms[0]
    : null;

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Traffic & Engagement (30d)</h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Live Data
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {/* Total Clicks */}
        <div className="bg-blue-50 p-4 rounded-xl">
          <div className="flex items-center">
            <EyeIcon className="h-6 w-6 text-blue-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-blue-600">{data.totalClicks}</div>
              <div className="text-sm text-gray-600">Total Clicks</div>
            </div>
          </div>
        </div>

        {/* Unique Visitors */}
        <div className="bg-green-50 p-4 rounded-xl">
          <div className="flex items-center">
            <div className="h-6 w-6 bg-green-600 rounded-full mr-3 flex items-center justify-center">
              <span className="text-xs text-white font-bold">U</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{data.uniqueVisitors}</div>
              <div className="text-sm text-gray-600">Unique Visitors</div>
            </div>
          </div>
        </div>

        {/* Call Clicks */}
        <div className="bg-orange-50 p-4 rounded-xl">
          <div className="flex items-center">
            <PhoneIcon className="h-6 w-6 text-orange-600 mr-3" />
            <div>
              <div className="text-2xl font-bold text-orange-600">{data.callClicks}</div>
              <div className="text-sm text-gray-600">Call Clicks</div>
            </div>
          </div>
        </div>

        {/* Mobile vs Desktop */}
        <div className="bg-purple-50 p-4 rounded-xl md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Device Breakdown</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <DevicePhoneMobileIcon className="h-5 w-5 text-purple-600 mr-2" />
              <span className="text-sm font-medium text-purple-600">
                {data.deviceBreakdown?.mobile || 0}% Mobile
              </span>
            </div>
            <div className="flex items-center">
              <ComputerDesktopIcon className="h-5 w-5 text-purple-400 mr-2" />
              <span className="text-sm font-medium text-purple-400">
                {data.deviceBreakdown?.desktop || 0}% Desktop
              </span>
            </div>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full"
              style={{ width: `${data.deviceBreakdown?.mobile || 0}%` }}
            ></div>
          </div>
        </div>

        {/* Most Clicked Action */}
        <div className="bg-yellow-50 p-4 rounded-xl">
          <div className="text-sm font-medium text-gray-700 mb-1">Top Action</div>
          {topAction ? (
            <div>
              <div className="text-lg font-bold text-yellow-600 capitalize">
                {topAction.type}
              </div>
              <div className="text-sm text-gray-600">{topAction.count} clicks</div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No action data</div>
          )}
        </div>
      </div>

      {/* Top Search Term */}
      {topQuery && (
        <div className="border-t border-gray-200 pt-4">
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-700">Top Search Term</div>
                <div className="text-lg font-semibold text-gray-900 mt-1">
                  "{topQuery.term}"
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{topQuery.clicks}</div>
                <div className="text-sm text-gray-600">clicks</div>
              </div>
            </div>
            {topQuery.ctr && (
              <div className="mt-2 text-sm text-gray-600">
                CTR: {topQuery.ctr.toFixed(2)}%
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="border-t border-gray-200 pt-4 mt-4">
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            View Full Report
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Export Data
          </button>
        </div>
      </div>
    </div>
  );
}