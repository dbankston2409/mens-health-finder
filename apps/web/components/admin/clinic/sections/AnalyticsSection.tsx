import React, { useState } from 'react';
import { DetailedClinic } from '../../../../utils/admin/useClinicData';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsSectionProps {
  analytics: DetailedClinic['analytics'];
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ analytics }) => {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  // Generate mock data for charts based on the analytics data
  const generateChartData = () => {
    // For simplicity, we'll generate random data based on the current analytics values
    const dates = [];
    const pageViews = [];
    const visitors = [];
    
    const daysToGenerate = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 12;
    const today = new Date();
    
    if (timeRange === 'year') {
      // Monthly data for year view
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 0; i < 12; i++) {
        dates.push(months[i]);
        
        // Random data that averages around the total values divided by 12
        const basePageViews = Math.round(analytics.pageViews / 12);
        const baseVisitors = Math.round(analytics.uniqueVisitors / 12);
        
        pageViews.push(basePageViews + Math.floor(Math.random() * basePageViews * 0.4 - basePageViews * 0.2));
        visitors.push(baseVisitors + Math.floor(Math.random() * baseVisitors * 0.4 - baseVisitors * 0.2));
      }
    } else {
      // Daily data for week/month view
      for (let i = 0; i < daysToGenerate; i++) {
        const date = new Date();
        date.setDate(today.getDate() - (daysToGenerate - i - 1));
        dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
        
        // Random data that averages around the total values divided by days
        const basePageViews = Math.round(analytics.pageViews / daysToGenerate);
        const baseVisitors = Math.round(analytics.uniqueVisitors / daysToGenerate);
        
        pageViews.push(basePageViews + Math.floor(Math.random() * basePageViews * 0.5 - basePageViews * 0.25));
        visitors.push(baseVisitors + Math.floor(Math.random() * baseVisitors * 0.5 - baseVisitors * 0.25));
      }
    }
    
    return {
      labels: dates,
      datasets: [
        {
          label: 'Page Views',
          data: pageViews,
          borderColor: '#7837FC',
          backgroundColor: 'rgba(120, 55, 252, 0.1)',
          tension: 0.3},
        {
          label: 'Unique Visitors',
          data: visitors,
          borderColor: '#38BDF8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          tension: 0.3}]};
  };

  const sourceChartData = {
    labels: analytics.sources.map(src => src.source),
    datasets: [
      {
        data: analytics.sources.map(src => src.count),
        backgroundColor: [
          'rgba(120, 55, 252, 0.7)',
          'rgba(56, 189, 248, 0.7)',
          'rgba(251, 146, 60, 0.7)',
          'rgba(139, 92, 246, 0.7)'],
        borderColor: [
          'rgba(120, 55, 252, 1)',
          'rgba(56, 189, 248, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(139, 92, 246, 1)'],
        borderWidth: 1}]};

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'},
        ticks: {
          color: '#9CA3AF'}},
      x: {
        grid: {
          display: false},
        ticks: {
          color: '#9CA3AF'}}},
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#E5E7EB',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'}},
      tooltip: {
        backgroundColor: 'rgba(17, 17, 17, 0.9)',
        titleColor: '#E5E7EB',
        bodyColor: '#E5E7EB',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: true}}};

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: '#E5E7EB',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'}},
      tooltip: {
        backgroundColor: 'rgba(17, 17, 17, 0.9)',
        titleColor: '#E5E7EB',
        bodyColor: '#E5E7EB',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: true}}};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Traffic Chart */}
      <div className="lg:col-span-3 bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h3 className="text-lg font-medium">Traffic Overview</h3>
          
          <div className="mt-3 sm:mt-0 flex bg-gray-800 rounded-md p-1">
            <button 
              onClick={() => setTimeRange('week')}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'week' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Week
            </button>
            <button 
              onClick={() => setTimeRange('month')}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'month' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Month
            </button>
            <button 
              onClick={() => setTimeRange('year')}
              className={`px-3 py-1 text-sm rounded-md ${timeRange === 'year' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Year
            </button>
          </div>
        </div>
        
        <div className="h-80 mb-6">
          <Line data={generateChartData()} options={chartOptions} />
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Page Views</div>
            <div className="text-xl font-medium">{analytics.pageViews.toLocaleString()}</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Unique Visitors</div>
            <div className="text-xl font-medium">{analytics.uniqueVisitors.toLocaleString()}</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Bounce Rate</div>
            <div className="text-xl font-medium">{analytics.bounceRate}%</div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Avg. Time</div>
            <div className="text-xl font-medium">{analytics.avgTimeOnPage} min</div>
          </div>
        </div>
      </div>

      {/* Traffic Sources */}
      <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Traffic Sources</h3>
        
        <div className="h-64 mb-4">
          <Doughnut data={sourceChartData} options={doughnutOptions} />
        </div>
        
        <div className="space-y-2">
          {analytics.sources.map((source, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="text-sm">{source.source}</div>
              <div className="text-sm text-gray-400">{source.count} visits</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Keywords */}
      <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Top Keywords</h3>
        
        <div className="space-y-4">
          {analytics.keywords.map((keyword, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">{keyword.keyword}</div>
                <div className="text-xs text-gray-400">{keyword.impressions} impressions</div>
              </div>
              
              <div className="flex items-center">
                <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${(keyword.clicks / keyword.impressions) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-400">{keyword.clicks} clicks</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
        <h3 className="text-lg font-medium mb-4">Conversion Metrics</h3>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm">Call Button Clicks</div>
              <div className="text-lg font-medium">{analytics.callClicks}</div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(analytics.callClicks / analytics.uniqueVisitors) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400">
                {((analytics.callClicks / analytics.uniqueVisitors) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm">Form Submissions</div>
              <div className="text-lg font-medium">{analytics.formSubmits}</div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-1 bg-gray-700 rounded-full h-2 mr-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${(analytics.formSubmits / analytics.uniqueVisitors) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-400">
                {((analytics.formSubmits / analytics.uniqueVisitors) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <button className="w-full bg-gray-800 hover:bg-gray-700 py-2 rounded-md text-sm">
              View Detailed Analytics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;