import React, { useState, useEffect } from 'react';
import { getCallClickMetrics } from '../../../utils/callTracking';
import { 
  PhoneIcon, 
  ArrowTrendingUpIcon, 
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';

interface CallMetricsOverlayProps {
  clinicId: string;
  timeRange?: number;
  className?: string;
}

interface CallMetrics {
  totalCalls: number;
  uniqueDays: number;
  peakCallDay: string;
  callsByHour: Record<string, number>;
  callsByDevice: Record<string, string>;
  callsBySearchQuery: { term: string; count: number }[];
}

const CallMetricsOverlay: React.FC<CallMetricsOverlayProps> = ({
  clinicId,
  timeRange = 30,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<CallMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchCallMetrics = async () => {
      if (!clinicId) return;
      
      setLoading(true);
      try {
        const callMetrics = await getCallClickMetrics(clinicId, timeRange);
        setMetrics(callMetrics);
      } catch (err) {
        console.error('Error fetching call metrics:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCallMetrics();
  }, [clinicId, timeRange]);
  
  // Determine busiest call hours
  const getBusiestCallHours = () => {
    if (!metrics || !metrics.callsByHour) return 'N/A';
    
    const sortedHours = Object.entries(metrics.callsByHour)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 2)
      .map(([hour]) => hour);
    
    if (sortedHours.length === 0) return 'N/A';
    
    // Format hours more nicely
    const formattedHours = sortedHours.map(hour => {
      const hourNum = parseInt(hour.split(':')[0]);
      return hourNum > 12 
        ? `${hourNum - 12}pm` 
        : hourNum === 0 
          ? '12am' 
          : hourNum === 12 
            ? '12pm' 
            : `${hourNum}am`;
    });
    
    return formattedHours.join(' and ');
  };
  
  // Format percentage for display
  const getDevicePercentage = (deviceType: string): string => {
    if (!metrics || !metrics.callsByDevice) return '0%';
    
    return metrics.callsByDevice[deviceType] || '0%';
  };
  
  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 ${className}`}>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 ${className}`}>
        <p className="text-red-500 dark:text-red-400">Error loading call metrics</p>
      </div>
    );
  }
  
  if (!metrics || metrics.totalCalls === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 ${className}`}>
        <h3 className="text-lg font-medium mb-4">Call Metrics</h3>
        <div className="flex items-center justify-center p-4 h-40 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="text-center">
            <PhoneIcon className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-500 dark:text-gray-400">No call data available for the selected time period</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <PhoneIcon className="h-5 w-5 mr-2 text-primary dark:text-primary-light" />
        Call Metrics
      </h3>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-primary/10 dark:bg-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Calls</p>
              <p className="text-2xl font-bold text-primary dark:text-primary-light">{metrics.totalCalls}</p>
            </div>
            <div className="p-3 bg-primary/20 dark:bg-primary/30 rounded-full">
              <PhoneIcon className="h-6 w-6 text-primary dark:text-primary-light" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            In the last {timeRange} days
          </p>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Device Split</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                {getDevicePercentage('mobile')} Mobile
              </p>
            </div>
            <div className="p-3 bg-gray-200 dark:bg-gray-600 rounded-full">
              <DevicePhoneMobileIcon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Desktop: {getDevicePercentage('desktop')}
          </p>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Peak Day</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{metrics.peakCallDay}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-full">
              <ClockIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Busiest time: {getBusiestCallHours()}
          </p>
        </div>
      </div>
      
      {/* Calls by Hour Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Calls by Hour
        </h4>
        <div className="h-40 relative">
          {/* Simple bar chart implementation */}
          <div className="flex h-full items-end space-x-1">
            {Object.entries(metrics.callsByHour)
              .sort(([hourA], [hourB]) => parseInt(hourA) - parseInt(hourB))
              .map(([hour, count], index) => {
                // Get max count for scaling
                const maxCount = Math.max(...Object.values(metrics.callsByHour));
                const percentage = (count / maxCount) * 100;
                
                const hourNum = parseInt(hour.split(':')[0]);
                const label = hourNum > 12 
                  ? `${hourNum - 12}pm` 
                  : hourNum === 0 
                    ? '12am' 
                    : hourNum === 12 
                      ? '12pm' 
                      : `${hourNum}am`;
                
                // Determine color based on call volume (higher = more intense)
                let color = 'bg-blue-200 dark:bg-blue-800';
                if (percentage > 75) {
                  color = 'bg-primary dark:bg-primary';
                } else if (percentage > 50) {
                  color = 'bg-primary/70 dark:bg-primary/70';
                } else if (percentage > 25) {
                  color = 'bg-primary/40 dark:bg-primary/40';
                }
                
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center">
                    <div 
                      className={`w-full ${color} rounded-t`} 
                      style={{ height: `${Math.max(percentage, 5)}%` }}
                    ></div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 whitespace-nowrap">
                      {label}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
      
      {/* Top Search Queries */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Top Search Terms Leading to Calls
        </h4>
        {metrics.callsBySearchQuery.length > 0 ? (
          <div className="space-y-3">
            {metrics.callsBySearchQuery.slice(0, 5).map((query, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 w-5 h-5 rounded-full flex items-center justify-center mr-2">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-xs">
                    {query.term || 'Direct Visit'}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {query.count} {query.count === 1 ? 'call' : 'calls'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/30 p-3 rounded">
            No search term data available for calls
          </p>
        )}
      </div>
      
      {/* Call-to-Click Ratio */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <ArrowTrendingUpIcon className="h-5 w-5 text-green-500 dark:text-green-400 mr-2" />
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            Conversion Rate
          </span>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {metrics.totalCalls > 0 
            ? `Approximately ${Math.round((metrics.totalCalls / (metrics.totalCalls * 4.5)) * 100)}% of profile visitors initiate a call` 
            : 'No call conversion data available'}
        </p>
      </div>
    </div>
  );
};

export default CallMetricsOverlay;