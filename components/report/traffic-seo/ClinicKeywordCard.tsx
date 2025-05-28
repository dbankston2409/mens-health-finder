import React from 'react';
import { MagnifyingGlassIcon, TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/outline';

interface KeywordData {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  intentType: 'service' | 'brand' | 'geo' | 'general';
  trend?: 'up' | 'down' | 'stable';
}

interface ClinicKeywordCardProps {
  clinicId: string;
  keywords?: KeywordData[];
  showRankings?: boolean;
  compact?: boolean;
}

export function ClinicKeywordCard({ 
  clinicId, 
  keywords = [], 
  showRankings = true, 
  compact = false 
}: ClinicKeywordCardProps) {
  
  // Mock keyword data if none provided
  const mockKeywords: KeywordData[] = [
    {
      keyword: 'testosterone replacement therapy near me',
      clicks: 45,
      impressions: 1200,
      ctr: 3.75,
      position: 12.5,
      intentType: 'service',
      trend: 'up'
    },
    {
      keyword: 'mens health clinic',
      clicks: 32,
      impressions: 890,
      ctr: 3.6,
      position: 15.2,
      intentType: 'service',
      trend: 'stable'
    },
    {
      keyword: 'low testosterone treatment',
      clicks: 28,
      impressions: 950,
      ctr: 2.95,
      position: 18.7,
      intentType: 'service',
      trend: 'up'
    },
    {
      keyword: 'trt clinic austin',
      clicks: 25,
      impressions: 420,
      ctr: 5.95,
      position: 8.3,
      intentType: 'geo',
      trend: 'down'
    },
    {
      keyword: 'hormone replacement therapy',
      clicks: 18,
      impressions: 760,
      ctr: 2.37,
      position: 22.1,
      intentType: 'service',
      trend: 'stable'
    }
  ];

  const displayKeywords = keywords.length > 0 ? keywords : mockKeywords;
  const topKeywords = displayKeywords.slice(0, compact ? 3 : 5);

  const getIntentColor = (intentType: string) => {
    switch (intentType) {
      case 'service':
        return 'bg-blue-100 text-blue-800';
      case 'brand':
        return 'bg-purple-100 text-purple-800';
      case 'geo':
        return 'bg-green-100 text-green-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUpIcon className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDownIcon className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const formatPosition = (position: number) => {
    return position.toFixed(1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <MagnifyingGlassIcon className="h-5 w-5 mr-2 text-blue-600" />
            Top Search Keywords
          </h3>
          <p className="text-sm text-gray-600">Last 30 days performance</p>
        </div>
        {!compact && (
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {topKeywords.reduce((sum, kw) => sum + kw.clicks, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Clicks</div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {topKeywords.map((keyword, index) => (
          <div key={keyword.keyword} className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full font-bold text-xs">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">
                    "{keyword.keyword}"
                  </div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getIntentColor(keyword.intentType)}`}>
                      {keyword.intentType}
                    </span>
                    {keyword.trend && getTrendIcon(keyword.trend)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {/* Clicks */}
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{keyword.clicks}</div>
                <div className="text-xs text-gray-500">Clicks</div>
              </div>

              {/* CTR */}
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">{keyword.ctr.toFixed(2)}%</div>
                <div className="text-xs text-gray-500">CTR</div>
              </div>

              {/* Impressions */}
              {!compact && (
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {keyword.impressions.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">Impressions</div>
                </div>
              )}

              {/* Position */}
              {showRankings && (
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    #{formatPosition(keyword.position)}
                  </div>
                  <div className="text-xs text-gray-500">Avg Position</div>
                </div>
              )}
            </div>

            {/* Performance Bar */}
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((keyword.ctr / 10) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                CTR Performance
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Intent Legend */}
      {!compact && (
        <div className="border-t border-gray-200 pt-4 mt-6">
          <div className="text-sm font-medium text-gray-700 mb-2">Search Intent Types:</div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              Service - Treatment focused
            </span>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              Geo - Location specific
            </span>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
              Brand - Clinic name
            </span>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
              General - Broad terms
            </span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            View All Keywords
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
            Keyword Opportunities
          </button>
          {!compact && (
            <button className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
              Optimize SEO
            </button>
          )}
        </div>
      </div>
    </div>
  );
}