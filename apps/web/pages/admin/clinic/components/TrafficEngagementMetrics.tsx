import React, { useState } from 'react';
import { 
  ArrowTrendingUpIcon, 
  EyeIcon, 
  CursorArrowRaysIcon as MousePointerIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';
import { TrafficMetrics } from '../../../../utils/hooks/useTraffic';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface TrafficEngagementMetricsProps {
  trafficData: TrafficMetrics;
  loading: boolean;
}

const TrafficEngagementMetrics: React.FC<TrafficEngagementMetricsProps> = ({
  trafficData,
  loading
}) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');
  
  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format daily traffic data for charts based on selected time range
  const getChartData = () => {
    if (!trafficData.dailyTraffic || trafficData.dailyTraffic.length === 0) {
      return [];
    }
    
    const sorted = [...trafficData.dailyTraffic].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (timeRange === '7d') {
      return sorted.slice(-7);
    } else if (timeRange === '30d') {
      return sorted.slice(-30);
    }
    
    return sorted;
  };

  // Format data for the bar chart of search terms
  const getSearchTermsData = () => {
    return trafficData.topSearchTerms.map(item => ({
      name: item.term.length > 15 ? item.term.substring(0, 15) + '...' : item.term,
      count: item.count
    }));
  };

  // Format data for the referring cities chart
  const getCitiesData = () => {
    return trafficData.topCities.map(item => ({
      name: `${item.city}, ${item.state}`,
      count: item.count
    }));
  };

  const chartData = getChartData();
  const searchTermsData = getSearchTermsData();
  const citiesData = getCitiesData();

  // Generate custom colors for charts
  const getChartColors = () => {
    return {
      views: '#3b82f6', // blue
      clicks: '#10b981', // green
      searchTerms: '#8b5cf6', // purple
      cities: '#f59e0b' // amber
    };
  };

  const colors = getChartColors();

  // Format dates for X-axis labels
  const formatXAxisDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-60 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Traffic Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Traffic & Engagement</h2>
          
          <div className="inline-flex rounded-md shadow-sm">
            <button
              type="button"
              className={`px-3 py-1.5 text-sm font-medium rounded-l-md ${
                timeRange === '7d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              onClick={() => setTimeRange('7d')}
            >
              7 Days
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm font-medium ${
                timeRange === '30d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-t border-b border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md ${
                timeRange === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              onClick={() => setTimeRange('all')}
            >
              All Time
            </button>
          </div>
        </div>
        
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Views */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
            <div className="flex items-start">
              <div className="mr-4 bg-blue-100 dark:bg-blue-800 p-2 rounded-md">
                <EyeIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Views</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {trafficData.totalViews.toLocaleString()}
                  </p>
                  <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    ({trafficData.viewsLast30Days.toLocaleString()} in last 30d)
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Clicks */}
          <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-4 border border-green-100 dark:border-green-800">
            <div className="flex items-start">
              <div className="mr-4 bg-green-100 dark:bg-green-800 p-2 rounded-md">
                <MousePointerIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Clicks</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {trafficData.totalClicks.toLocaleString()}
                  </p>
                  <p className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                    ({trafficData.clicksLast30Days.toLocaleString()} in last 30d)
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Last Viewed */}
          <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
            <div className="flex items-start">
              <div className="mr-4 bg-purple-100 dark:bg-purple-800 p-2 rounded-md">
                <ClockIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Last Viewed</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {trafficData.lastViewed ? formatDate(trafficData.lastViewed) : 'Never'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Traffic Over Time Chart */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Traffic Trends</h3>
          
          {chartData.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxisDate}
                    tick={{ fill: '#6B7280' }}
                    angle={-45}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fill: '#6B7280' }} />
                  <RechartsTooltip
                    formatter={(value: number) => [`${value} interactions`, '']}
                    labelFormatter={(label) => formatXAxisDate(label as string)}
                    contentStyle={{ 
                      backgroundColor: '#1F2937',
                      borderColor: '#374151',
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    name="Views"
                    stroke={colors.views} 
                    activeDot={{ r: 8 }}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="clicks" 
                    name="Clicks"
                    stroke={colors.clicks} 
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-60 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">No traffic data available</p>
            </div>
          )}
        </div>
        
        {/* Search Terms and Referring Cities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Search Terms */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <MagnifyingGlassIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Top Search Terms
            </h3>
            
            {searchTermsData.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={searchTermsData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#6B7280' }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fill: '#6B7280' }}
                      width={120}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => [`${value} searches`, '']}
                      contentStyle={{ 
                        backgroundColor: '#1F2937',
                        borderColor: '#374151',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar dataKey="count" name="Search Count" fill={colors.searchTerms} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-60 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No search terms data available</p>
              </div>
            )}
          </div>
          
          {/* Top Referring Cities */}
          <div>
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
              Top Referring Cities
            </h3>
            
            {citiesData.length > 0 ? (
              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={citiesData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#6B7280' }} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      tick={{ fill: '#6B7280' }}
                      width={120}
                    />
                    <RechartsTooltip
                      formatter={(value: number) => [`${value} visits`, '']}
                      contentStyle={{ 
                        backgroundColor: '#1F2937',
                        borderColor: '#374151',
                        color: '#F9FAFB'
                      }}
                    />
                    <Bar dataKey="count" name="Visit Count" fill={colors.cities} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-60 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No city data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficEngagementMetrics;