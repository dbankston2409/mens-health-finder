import React, { useState } from 'react';
import {
  ArrowPathIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  EyeIcon
} from '@heroicons/react/24/solid';
import { TrafficMetrics } from '../../../../utils/metrics/types';
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

interface TrafficAnalyticsPanelProps {
  data: TrafficMetrics | null;
  loading: boolean;
  onRefresh: () => void;
}

const TrafficAnalyticsPanel: React.FC<TrafficAnalyticsPanelProps> = ({ data, loading, onRefresh }) => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('30d');

  // Format daily traffic data for charts based on selected time range
  const getChartData = () => {
    if (!data?.dailyTraffic || data.dailyTraffic.length === 0) {
      return [];
    }
    
    const sorted = [...data.dailyTraffic].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    if (timeRange === '7d') {
      return sorted.slice(-7);
    }
    
    return sorted;
  };

  // Format data for the bar chart of top pages
  const getPagesChartData = () => {
    if (!data?.topPages) return [];
    
    return data.topPages.map(page => ({
      name: page.slug.length > 15 ? `...${page.slug.substring(page.slug.length - 15)}` : page.slug,
      clicks: page.clickCount,
      fullPath: page.slug
    }));
  };

  // Format data for the search terms chart
  const getSearchTermsData = () => {
    if (!data?.topSearchQueries) return [];
    
    return data.topSearchQueries.map(item => ({
      name: item.term.length > 15 ? item.term.substring(0, 15) + '...' : item.term,
      count: item.count,
      fullTerm: item.term
    }));
  };

  // Format dates for X-axis labels
  const formatXAxisDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = getChartData();
  const pagesChartData = getPagesChartData();
  const searchTermsData = getSearchTermsData();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <ChartBarIcon className="h-6 w-6 text-blue-500 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Traffic Analytics</h2>
        </div>
        
        <div className="flex items-center space-x-3">
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
              className={`px-3 py-1.5 text-sm font-medium rounded-r-md ${
                timeRange === '30d' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-t border-b border-r border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
              onClick={() => setTimeRange('30d')}
            >
              30 Days
            </button>
          </div>
          
          <button 
            onClick={onRefresh}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            title="Refresh data"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-72 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      ) : !data ? (
        <div className="py-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            Failed to load traffic data. Try refreshing.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
              <div className="text-sm text-blue-700 dark:text-blue-300 mb-1 flex items-center">
                <EyeIcon className="h-4 w-4 mr-1" />
                <span>Total Clicks (30d)</span>
              </div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                {data.totalClicksThisMonth.toLocaleString()}
              </div>
            </div>
            
            {data.bounceRateEstimate !== undefined && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">Bounce Rate</div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {data.bounceRateEstimate.toFixed(1)}%
                </div>
              </div>
            )}
            
            {data.avgClicksPerDay !== undefined && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  <span>Avg. Clicks/Day</span>
                </div>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {data.avgClicksPerDay.toFixed(1)}
                </div>
              </div>
            )}
            
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="text-sm text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                <span>Top Landing Page</span>
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {data.topPages && data.topPages.length > 0 
                  ? data.topPages[0].slug.split('/').pop() || data.topPages[0].slug
                  : 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Traffic Over Time Chart */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Traffic Trends</h3>
            
            {chartData.length > 0 ? (
              <div className="h-72 w-full">
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
                      stroke="#3B82F6" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clicks" 
                      name="Clicks"
                      stroke="#10B981" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-72 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No traffic data available</p>
              </div>
            )}
          </div>
          
          {/* Top Pages and Search Queries */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Top Pages */}
            <div>
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Top Pages</h3>
              
              {pagesChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={pagesChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" tick={{ fill: '#6B7280' }} />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        tick={{ fill: '#6B7280' }}
                        width={100}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [`${value} clicks`, '']}
                        labelFormatter={(label) => pagesChartData.find(item => item.name === label)?.fullPath || label}
                        contentStyle={{ 
                          backgroundColor: '#1F2937',
                          borderColor: '#374151',
                          color: '#F9FAFB'
                        }}
                      />
                      <Bar dataKey="clicks" name="Clicks" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">No page data available</p>
                </div>
              )}
            </div>
            
            {/* Top Search Queries */}
            <div>
              <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-4">Top Search Queries</h3>
              
              {searchTermsData.length > 0 ? (
                <div className="h-64 w-full">
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
                        width={100}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => [`${value} searches`, '']}
                        labelFormatter={(label) => searchTermsData.find(item => item.name === label)?.fullTerm || label}
                        contentStyle={{ 
                          backgroundColor: '#1F2937',
                          borderColor: '#374151',
                          color: '#F9FAFB'
                        }}
                      />
                      <Bar dataKey="count" name="Searches" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-500 dark:text-gray-400">No search terms data available</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default TrafficAnalyticsPanel;