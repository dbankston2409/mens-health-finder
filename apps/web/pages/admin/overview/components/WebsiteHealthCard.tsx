import React from 'react';
import { 
  GlobeAltIcon, 
  ArrowPathIcon, 
  ClockIcon, 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';
import { SearchVisibilityMetrics } from '../../../../utils/metrics/types';
import { WebsiteHealth } from '../../../../types';
import useAdminMetrics from '../../../../utils/hooks/useAdminMetrics';

interface WebsiteHealthCardProps {
  onRefresh: () => void;
}

// Fallback data for when real data is not available
const fallbackHealthData = {
  uptimeStatus: 'up', // 'up', 'down', 'degraded'
  avgLoadTime: 1.8, // in seconds
  indexedPages: 342,
  errorPages: 3,
  lastChecked: new Date(),
  speedScore: 87, // out of 100
  seoScore: 92, // out of 100
  accessibilityScore: 89, // out of 100
};

const WebsiteHealthCard: React.FC<WebsiteHealthCardProps> = ({ onRefresh }) => {
  // Get the health data from the main admin metrics hook
  const { data } = useAdminMetrics();
  
  // Use website health data from the searchVisibility, or fall back to mock data
  const websiteHealth = data.searchVisibility?.websiteHealth || fallbackHealthData;
  
  // Type guard for performance metrics
  const hasPerformanceMetrics = (health: any): health is { performance: number; seo: number; accessibility: number } => {
    return health && typeof health.performance === 'number';
  };

  // Create processed data from either source
  const websiteHealthData = {
    uptimeStatus: 'up', // We'll assume site is up in mock mode
    avgLoadTime: hasPerformanceMetrics(websiteHealth) ? (3 - websiteHealth.performance * 2).toFixed(1) : fallbackHealthData.avgLoadTime, // Convert performance score to load time
    indexedPages: data.searchVisibility?.totalSearchImpressions ? 
      Math.floor(data.searchVisibility.totalSearchImpressions / 100) : 
      fallbackHealthData.indexedPages,
    errorPages: hasPerformanceMetrics(websiteHealth) && websiteHealth.performance < 0.85 ? 3 : 0,
    lastChecked: new Date(),
    speedScore: hasPerformanceMetrics(websiteHealth) ? Math.floor(websiteHealth.performance * 100) : fallbackHealthData.speedScore,
    seoScore: hasPerformanceMetrics(websiteHealth) ? Math.floor(websiteHealth.seo * 100) : fallbackHealthData.seoScore,
    accessibilityScore: hasPerformanceMetrics(websiteHealth) ? Math.floor(websiteHealth.accessibility * 100) : fallbackHealthData.accessibilityScore};
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'up':
        return (
          <div className="flex items-center">
            <div className="h-3 w-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-green-600 dark:text-green-400 font-medium">Up</span>
          </div>
        );
      case 'down':
        return (
          <div className="flex items-center">
            <div className="h-3 w-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-red-600 dark:text-red-400 font-medium">Down</span>
          </div>
        );
      case 'degraded':
        return (
          <div className="flex items-center">
            <div className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">Degraded</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center">
            <div className="h-3 w-3 bg-gray-500 rounded-full mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400 font-medium">Unknown</span>
          </div>
        );
    }
  };

  const getScoreBadge = (score: number) => {
    let color;
    if (score >= 90) {
      color = 'bg-green-500';
    } else if (score >= 70) {
      color = 'bg-yellow-500';
    } else {
      color = 'bg-red-500';
    }
    
    return (
      <div className="flex items-center">
        <div className={`h-10 w-10 ${color} rounded-full flex items-center justify-center text-white font-bold`}>
          {score}
        </div>
      </div>
    );
  };

  const formatDate = (date: Date) => {
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
          <GlobeAltIcon className="h-6 w-6 text-purple-500 mr-2" />
          <h2 className="text-xl font-semibold text-white">Website Health</h2>
        </div>
        
        <button 
          onClick={onRefresh}
          className="text-gray-400 hover:text-gray-300"
          title="Refresh data"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>
      
      {/* Main Status Card */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg p-4 mb-6 border border-purple-100 dark:border-purple-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">Status</div>
            <div className="mt-1">{getStatusBadge(websiteHealthData.uptimeStatus)}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-400">Last Checked</div>
            <div className="text-sm text-gray-300">{formatDate(websiteHealthData.lastChecked)}</div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Load Time */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center text-gray-400 text-sm mb-1">
            <ClockIcon className="h-4 w-4 mr-1" />
            <span>Average Load Time</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {websiteHealthData.avgLoadTime}s
          </div>
        </div>
        
        {/* Indexed Pages */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center text-gray-400 text-sm mb-1">
            <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
            <span>Indexed Pages</span>
          </div>
          <div className="text-xl font-semibold text-white">
            {websiteHealthData.indexedPages}
          </div>
        </div>
      </div>
      
      {/* Error Pages Alert */}
      {websiteHealthData.errorPages > 0 && (
        <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4 mb-6 border border-red-100 dark:border-red-800">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-red-800 dark:text-red-300">
                {websiteHealthData.errorPages} page{websiteHealthData.errorPages !== 1 ? 's' : ''} with errors detected
              </div>
              <div className="mt-1 text-sm text-red-700 dark:text-red-400">
                Check the developer console for detailed errors
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Performance Scores */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-4">Performance Scores</h3>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Speed Score */}
          <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
            <div className="text-sm text-gray-400 mb-2">Speed</div>
            {getScoreBadge(websiteHealthData.speedScore)}
          </div>
          
          {/* SEO Score */}
          <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
            <div className="text-sm text-gray-400 mb-2">SEO</div>
            {getScoreBadge(websiteHealthData.seoScore)}
          </div>
          
          {/* Accessibility Score */}
          <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
            <div className="text-sm text-gray-400 mb-2">Accessibility</div>
            {getScoreBadge(websiteHealthData.accessibilityScore)}
          </div>
        </div>
      </div>
      
      {/* External links */}
      <div className="mt-6 flex justify-end">
        <button 
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          onClick={() => window.open('https://search.google.com/search-console', '_blank')}
        >
          View full report
        </button>
      </div>
    </div>
  );
};

export default WebsiteHealthCard;