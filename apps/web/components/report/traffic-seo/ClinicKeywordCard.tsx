import React from 'react';
import { KeywordInsight, KeywordRanking } from '../../../utils/hooks/useClinicTrafficReport';

interface ClinicKeywordCardProps {
  data: KeywordInsight;
  className?: string;
}

const ClinicKeywordCard: React.FC<ClinicKeywordCardProps> = ({
  data,
  className = ''
}) => {
  // Helper to render ranking indicator
  const renderRankingIndicator = (ranking: KeywordRanking) => {
    switch (ranking) {
      case 'high':
        return (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
            Strong
          </div>
        );
      case 'medium':
        return (
          <div className="flex items-center text-yellow-600 dark:text-yellow-400">
            <span className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></span>
            Medium
          </div>
        );
      case 'low':
        return (
          <div className="flex items-center text-red-600 dark:text-red-400">
            <span className="h-3 w-3 bg-red-500 rounded-full mr-2"></span>
            Low
          </div>
        );
      default:
        return null;
    }
  };
  
  // Render keyword pills
  const renderKeywordPills = (keywords: string[], bgColor: string) => {
    if (keywords.length === 0) {
      return (
        <span className="text-gray-500 dark:text-gray-400 text-sm italic">None detected</span>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {keywords.map((keyword, index) => (
          <span 
            key={index}
            className={`${bgColor} px-2 py-1 rounded-full text-xs`}
          >
            {keyword}
          </span>
        ))}
      </div>
    );
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-medium mb-4">Keyword Analysis</h3>
      
      <div className="space-y-5">
        {/* Primary keywords */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Primary Keywords</span>
          </div>
          {renderKeywordPills(data.primary, 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200')}
        </div>
        
        {/* Geo keywords */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Geographic Keywords</span>
          </div>
          {renderKeywordPills(data.geo, 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200')}
        </div>
        
        {/* Service keywords */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Service Keywords</span>
          </div>
          {renderKeywordPills(data.services, 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200')}
        </div>
        
        {/* Ranking strength */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ranking Strength</span>
          </div>
          {renderRankingIndicator(data.rankingStrength)}
        </div>
        
        {/* Opportunity */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Opportunity</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{data.opportunity}</p>
        </div>
        
        {/* Missing suggestions */}
        {data.missingSuggestions && data.missingSuggestions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested Additions</span>
            </div>
            {renderKeywordPills(data.missingSuggestions, 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200')}
          </div>
        )}
        
        {/* Meta description suggestion */}
        {data.suggestedMetaDescription && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested Meta Description</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700 p-3 rounded-md">
              {data.suggestedMetaDescription}
            </p>
          </div>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic">
        * Based on search terms used to find this clinic
      </div>
    </div>
  );
};

export default ClinicKeywordCard;