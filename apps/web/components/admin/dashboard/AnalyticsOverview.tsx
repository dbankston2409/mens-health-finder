import React, { useState } from 'react';
import { useAdminMetrics } from '../../../utils/admin/useAdminMetrics';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const AnalyticsOverview: React.FC = () => {
  const { analytics, search, loading, error } = useAdminMetrics();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Generate mock data for trend chart
  const generateMockTrendData = (days: number) => {
    const labels = [];
    const data = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Generate some random but trending data with weekly pattern
      const dayOfWeek = date.getDay();
      const base = 350; // Base number of sessions
      const weekendDip = dayOfWeek === 0 || dayOfWeek === 6 ? 0.7 : 1; // Weekend has 30% fewer sessions
      const trend = 1 + ((days - i) * 0.005); // Gradually increasing trend
      const random = 0.85 + (Math.random() * 0.3); // Random variance between 0.85 and 1.15
      
      data.push(Math.round(base * weekendDip * trend * random));
    }

    return { labels, data };
  };

  // Get data for selected time range
  const getTrendData = () => {
    switch (timeRange) {
      case 'week':
        return generateMockTrendData(7);
      case 'year':
        // For year, we'll just show monthly data points
        return {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          data: [3100, 3250, 3400, 3580, 3720, 3850, 4020, 4200, 4380, 4500, 4680, 4830]
        };
      case 'month':
      default:
        return generateMockTrendData(30);
    }
  };

  const trendData = getTrendData();

  // Prepare chart data
  const chartData = {
    labels: trendData.labels,
    datasets: [
      {
        label: 'Sessions',
        data: trendData.data,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.3,
        fill: true}]};

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false},
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#0f0f0f',
        titleColor: '#ffffff',
        bodyColor: '#cccccc',
        borderColor: '#333333',
        borderWidth: 1}},
    scales: {
      x: {
        grid: {
          display: false,
          color: '#222222'},
        ticks: {
          color: '#aaaaaa',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: timeRange === 'week' ? 7 : timeRange === 'month' ? 10 : 12}},
      y: {
        grid: {
          color: '#222222'},
        ticks: {
          color: '#aaaaaa',
          precision: 0},
        beginAtZero: false}}};

  if (loading) {
    return (
      <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
        <div className="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium mb-2">Error Loading Data</h3>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Traffic & Analytics</h3>
        <div className="flex space-x-1 bg-[#0A0A0A] rounded-md p-1">
          <button
            className={`px-3 py-1 text-xs rounded ${timeRange === 'week' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setTimeRange('week')}
          >
            Week
          </button>
          <button
            className={`px-3 py-1 text-xs rounded ${timeRange === 'month' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setTimeRange('month')}
          >
            Month
          </button>
          <button
            className={`px-3 py-1 text-xs rounded ${timeRange === 'year' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setTimeRange('year')}
          >
            Year
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
          <div className="flex items-center mb-2">
            <div className="mr-2">
              <div className="p-2 bg-primary bg-opacity-20 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <h4 className="text-xs text-gray-400">Sessions</h4>
          </div>
          <p className="text-xl font-bold">{analytics.sessions.toLocaleString()}</p>
        </div>
        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
          <div className="flex items-center mb-2">
            <div className="mr-2">
              <div className="p-2 bg-blue-500 bg-opacity-20 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <h4 className="text-xs text-gray-400">Users</h4>
          </div>
          <p className="text-xl font-bold">{analytics.users.toLocaleString()}</p>
        </div>
        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
          <div className="flex items-center mb-2">
            <div className="mr-2">
              <div className="p-2 bg-yellow-500 bg-opacity-20 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <h4 className="text-xs text-gray-400">Bounce Rate</h4>
          </div>
          <p className="text-xl font-bold">{analytics.bounceRate}%</p>
        </div>
        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
          <div className="flex items-center mb-2">
            <div className="mr-2">
              <div className="p-2 bg-emerald-500 bg-opacity-20 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h4 className="text-xs text-gray-400">Avg Time</h4>
          </div>
          <p className="text-xl font-bold">{analytics.avgTimeOnSite}m</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
          <h4 className="text-sm font-medium mb-4">Sessions Trend</h4>
          <div className="h-64">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium">Top Traffic Sources</h4>
              <span className="text-xs text-gray-400">Sessions</span>
            </div>
            <div className="space-y-3">
              {analytics.topSources.map((source, index) => (
                <div key={index} className="flex items-center">
                  <div className="mr-3">
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      index === 0 ? 'bg-primary bg-opacity-20 text-primary' :
                      index === 1 ? 'bg-blue-500 bg-opacity-20 text-blue-500' :
                      index === 2 ? 'bg-yellow-500 bg-opacity-20 text-yellow-500' :
                      index === 3 ? 'bg-emerald-500 bg-opacity-20 text-emerald-500' :
                      'bg-gray-500 bg-opacity-20 text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{source.source}</span>
                      <span className="text-sm">{source.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1 bg-[#222222] rounded-full mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          index === 0 ? 'bg-primary' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-emerald-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${(source.count / analytics.topSources[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium">Top Pages</h4>
              <span className="text-xs text-gray-400">Views</span>
            </div>
            <div className="space-y-3">
              {analytics.topPages.map((page, index) => (
                <div key={index} className="flex items-center">
                  <div className="mr-3">
                    <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                      index === 0 ? 'bg-primary bg-opacity-20 text-primary' :
                      index === 1 ? 'bg-blue-500 bg-opacity-20 text-blue-500' :
                      index === 2 ? 'bg-yellow-500 bg-opacity-20 text-yellow-500' :
                      index === 3 ? 'bg-emerald-500 bg-opacity-20 text-emerald-500' :
                      'bg-gray-500 bg-opacity-20 text-gray-500'
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">{page.page}</span>
                      <span className="text-sm">{page.views.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1 bg-[#222222] rounded-full mt-1">
                      <div 
                        className={`h-1 rounded-full ${
                          index === 0 ? 'bg-primary' :
                          index === 1 ? 'bg-blue-500' :
                          index === 2 ? 'bg-yellow-500' :
                          index === 3 ? 'bg-emerald-500' :
                          'bg-gray-500'
                        }`}
                        style={{ width: `${(page.views / analytics.topPages[0].views) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222]">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-medium">Search Analytics</h4>
          <a href="#" className="text-primary hover:text-red-400 text-xs font-medium">
            View Search Console
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-[#111111] p-3 rounded-lg border border-[#222222]">
            <h5 className="text-xs text-gray-400 mb-1">Impressions</h5>
            <p className="text-lg font-bold">{search.impressions.toLocaleString()}</p>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#222222]">
            <h5 className="text-xs text-gray-400 mb-1">Clicks</h5>
            <p className="text-lg font-bold">{search.clicks.toLocaleString()}</p>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#222222]">
            <h5 className="text-xs text-gray-400 mb-1">CTR</h5>
            <p className="text-lg font-bold">{search.ctr}%</p>
          </div>
          <div className="bg-[#111111] p-3 rounded-lg border border-[#222222]">
            <h5 className="text-xs text-gray-400 mb-1">Avg. Position</h5>
            <p className="text-lg font-bold">{search.avgPosition}</p>
          </div>
        </div>

        <div>
          <h5 className="text-xs text-gray-400 mb-2">Top Queries</h5>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#222222]">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Query</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Impressions</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Clicks</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222] text-sm">
                {search.topQueries.map((query, index) => (
                  <tr key={index} className="hover:bg-[#151515]">
                    <td className="px-3 py-2 whitespace-nowrap">{query.query}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{query.impressions.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">{query.clicks.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {Math.round((query.clicks / query.impressions) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;