import React, { useState } from 'react';
import { PageData } from '../../../utils/hooks/useClinicTrafficReport';

interface TopPagesChartProps {
  data: PageData[];
}

const TopPagesChart: React.FC<TopPagesChartProps> = ({ data }) => {
  const [viewType, setViewType] = useState<'bar' | 'pie'>('bar');

  // Get the max click count for scaling
  const maxClicks = Math.max(...data.map(item => item.clicks));
  
  // Helper to truncate long URLs
  const truncateUrl = (url: string, maxLength = 30) => {
    if (url.length <= maxLength) return url;
    
    // Extract domain and path
    const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    
    // Simplify paths
    if (path.includes('/search')) {
      return 'Search Results';
    } else if (path.includes('/blog/')) {
      return `Blog: ${path.split('/').pop()?.replace(/-/g, ' ') || path}`;
    } else if (path.endsWith('/')) {
      return domain + path.substring(0, path.length - 1);
    }
    
    if (domain.length + path.length <= maxLength) {
      return domain + path;
    }
    
    return domain + '...' + path.substring(path.length - (maxLength - domain.length - 3));
  };
  
  // Get color for page type
  const getPageTypeColor = (type: 'internal' | 'referral' | 'search') => {
    switch (type) {
      case 'internal':
        return {
          bar: 'bg-blue-500',
          text: 'text-blue-700 dark:text-blue-300',
          pie: 'rgb(59, 130, 246)'
        };
      case 'search':
        return {
          bar: 'bg-green-500',
          text: 'text-green-700 dark:text-green-300',
          pie: 'rgb(16, 185, 129)'
        };
      case 'referral':
        return {
          bar: 'bg-purple-500',
          text: 'text-purple-700 dark:text-purple-300',
          pie: 'rgb(139, 92, 246)'
        };
      default:
        return {
          bar: 'bg-gray-500',
          text: 'text-gray-700 dark:text-gray-300',
          pie: 'rgb(107, 114, 128)'
        };
    }
  };
  
  // Render bar chart
  const renderBarChart = () => {
    // Sort data by clicks
    const sortedData = [...data].sort((a, b) => b.clicks - a.clicks).slice(0, 8);
    
    return (
      <div className="h-80 mt-4">
        <div className="flex h-full">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2">
            <span>{maxClicks}</span>
            <span>{Math.floor(maxClicks * 0.75)}</span>
            <span>{Math.floor(maxClicks * 0.5)}</span>
            <span>{Math.floor(maxClicks * 0.25)}</span>
            <span>0</span>
          </div>
          
          {/* Chart */}
          <div className="flex-1 flex items-end">
            <div className="w-full h-full flex items-end relative">
              {/* Grid lines */}
              <div className="absolute inset-0 border-t border-l border-gray-200 dark:border-gray-700">
                <div className="absolute left-0 right-0 top-0 border-b border-gray-200 dark:border-gray-700"></div>
                <div className="absolute left-0 right-0 top-1/4 border-b border-gray-200 dark:border-gray-700"></div>
                <div className="absolute left-0 right-0 top-1/2 border-b border-gray-200 dark:border-gray-700"></div>
                <div className="absolute left-0 right-0 top-3/4 border-b border-gray-200 dark:border-gray-700"></div>
              </div>
              
              {/* Bars */}
              <div className="relative z-10 flex items-end justify-around w-full h-full pb-6">
                {sortedData.map((item, index) => {
                  const barHeight = (item.clicks / maxClicks) * 100;
                  const color = getPageTypeColor(item.type);
                  
                  return (
                    <div key={index} className="flex flex-col items-center" style={{ width: `${100 / sortedData.length}%` }}>
                      <div 
                        className={`w-4/5 ${color.bar} rounded-t`}
                        style={{ height: `${barHeight}%` }}
                      ></div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center truncate w-full">
                        {truncateUrl(item.page)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render pie chart
  const renderPieChart = () => {
    // Group by type
    const groupedData = data.reduce<Record<string, number>>((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = 0;
      }
      acc[item.type] += item.clicks;
      return acc;
    }, {});
    
    const total = Object.values(groupedData).reduce((sum, value) => sum + value, 0);
    
    // Calculate percentages and sectors
    let startAngle = 0;
    const sectors = Object.entries(groupedData).map(([type, clicks]) => {
      const percentage = (clicks / total) * 100;
      const angle = (clicks / total) * 360;
      const color = getPageTypeColor(type as any).pie;
      
      const sector = {
        type,
        percentage,
        startAngle,
        endAngle: startAngle + angle,
        color
      };
      
      startAngle += angle;
      return sector;
    });
    
    return (
      <div className="h-80 mt-4 flex flex-col items-center justify-center">
        <div className="w-64 h-64 relative">
          <svg viewBox="0 0 100 100">
            {sectors.map((sector, index) => {
              // Convert angles to radians
              const startAngleRad = (sector.startAngle - 90) * (Math.PI / 180);
              const endAngleRad = (sector.endAngle - 90) * (Math.PI / 180);
              
              // Calculate arc points
              const x1 = 50 + 50 * Math.cos(startAngleRad);
              const y1 = 50 + 50 * Math.sin(startAngleRad);
              const x2 = 50 + 50 * Math.cos(endAngleRad);
              const y2 = 50 + 50 * Math.sin(endAngleRad);
              
              // Determine if the arc should be drawn as a large arc
              const largeArcFlag = sector.endAngle - sector.startAngle > 180 ? 1 : 0;
              
              // Generate the SVG arc path
              const path = `
                M 50 50
                L ${x1} ${y1}
                A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2}
                Z
              `;
              
              return (
                <path
                  key={index}
                  d={path}
                  fill={sector.color}
                  stroke="#fff"
                  strokeWidth="0.5"
                />
              );
            })}
          </svg>
        </div>
        
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {sectors.map((sector, index) => (
            <div key={index} className="flex items-center">
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: sector.color }}
              ></div>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {sector.type.charAt(0).toUpperCase() + sector.type.slice(1)}: {sector.percentage.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium">Top Traffic Sources</h3>
        
        <div className="flex border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
          <button
            className={`px-3 py-1 text-sm ${
              viewType === 'bar' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setViewType('bar')}
          >
            Bar
          </button>
          <button
            className={`px-3 py-1 text-sm ${
              viewType === 'pie' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setViewType('pie')}
          >
            Pie
          </button>
        </div>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Sources of traffic and clicks to this clinic
      </p>
      
      {data.length === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No page data available</p>
        </div>
      ) : viewType === 'bar' ? (
        renderBarChart()
      ) : (
        renderPieChart()
      )}
      
      <div className="mt-4 flex flex-wrap justify-center gap-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Internal Pages</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">Search Results</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
          <span className="text-xs text-gray-600 dark:text-gray-400">External Referrals</span>
        </div>
      </div>
    </div>
  );
};

export default TopPagesChart;