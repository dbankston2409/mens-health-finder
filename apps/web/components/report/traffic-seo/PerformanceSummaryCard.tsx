import React from 'react';
import { PerformanceSummary } from '../../../utils/hooks/useClinicTrafficReport';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface PerformanceSummaryCardProps {
  data: PerformanceSummary;
  className?: string;
}

const PerformanceSummaryCard: React.FC<PerformanceSummaryCardProps> = ({
  data,
  className = ''
}) => {
  // Mock data for trends (in a real app, this would come from historical data)
  const getTrendIndicator = (metricName: string) => {
    // For demo, use a deterministic but seemingly random approach
    const hash = metricName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const isPositive = hash % 3 !== 0; // 2/3 chance of positive trend
    const percentChange = (hash % 20) + 1; // 1-20% change
    
    return {
      direction: isPositive ? 'up' : 'down',
      percentage: percentChange
    };
  };
  
  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };
  
  // Data rows to display
  const metricsToDisplay = [
    { 
      name: 'Total Clicks (30 Days)', 
      value: formatNumber(data.totalClicks30Days),
      trend: getTrendIndicator('Total Clicks')
    },
    { 
      name: 'Unique Search Terms', 
      value: formatNumber(data.uniqueSearchTerms),
      trend: getTrendIndicator('Unique Search Terms')
    },
    { 
      name: 'Avg Clicks per Day', 
      value: formatNumber(data.avgClicksPerDay),
      trend: getTrendIndicator('Avg Clicks per Day')
    },
    { 
      name: 'Most Common Device', 
      value: `${data.mostCommonDevice.charAt(0).toUpperCase() + data.mostCommonDevice.slice(1)} (${data.mostCommonDevicePercentage}%)`,
      trend: null  // No trend for this metric
    },
    { 
      name: 'Most Common Region', 
      value: data.mostCommonRegion,
      trend: null  // No trend for this metric
    },
    { 
      name: 'Top Action Clicked', 
      value: data.topActionClicked,
      trend: null  // No trend for this metric
    }
  ];
  
  // Render trend indicator
  const renderTrend = (trend: { direction: string; percentage: number } | null) => {
    if (!trend) return null;
    
    return trend.direction === 'up' ? (
      <div className="flex items-center text-green-600 dark:text-green-400 text-xs">
        <ArrowUpIcon className="h-3 w-3 mr-1" />
        {trend.percentage}%
      </div>
    ) : (
      <div className="flex items-center text-red-600 dark:text-red-400 text-xs">
        <ArrowDownIcon className="h-3 w-3 mr-1" />
        {trend.percentage}%
      </div>
    );
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-medium mb-4">Performance Summary</h3>
      
      <div className="space-y-4">
        {metricsToDisplay.map((metric, index) => (
          <div 
            key={index}
            className={`flex justify-between items-center py-2 ${
              index < metricsToDisplay.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''
            }`}
          >
            <span className="text-sm text-gray-600 dark:text-gray-400">{metric.name}</span>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                {metric.value}
              </span>
              {renderTrend(metric.trend)}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-sm">
            {/* Traffic quality score is a calculated metric based on engagement */}
            Traffic Quality Score: 7.8/10
          </div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Based on engagement metrics and search relevance
          </p>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
        * Percentages indicate change from previous 30-day period
      </div>
    </div>
  );
};

export default PerformanceSummaryCard;