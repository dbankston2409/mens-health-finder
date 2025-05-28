import React from 'react';
import { ClinicEngagement } from '../../apps/worker/utils/detectClinicEngagement';

interface ClinicEngagementScoreProps {
  engagement?: ClinicEngagement | null;
  compact?: boolean;
  showDetails?: boolean;
}

/**
 * Display clinic engagement status with colored indicators
 */
export function ClinicEngagementScore({ 
  engagement, 
  compact = false, 
  showDetails = true 
}: ClinicEngagementScoreProps) {
  if (!engagement) {
    return (
      <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        <span className="w-2 h-2 rounded-full bg-gray-400 mr-1.5"></span>
        {compact ? 'N/A' : 'No Data'}
      </div>
    );
  }

  const { status, engagementScore, totalClicks30d, totalCalls30d, lastUpdated } = engagement;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'engaged':
        return {
          label: compact ? 'Active' : 'Engaged',
          color: 'bg-green-100 text-green-800',
          dot: 'bg-green-500',
          icon: '🔵'
        };
      case 'low':
        return {
          label: compact ? 'Low' : 'Low Activity',
          color: 'bg-yellow-100 text-yellow-800',
          dot: 'bg-yellow-500',
          icon: '🟠'
        };
      case 'none':
        return {
          label: compact ? 'Ghost' : 'No Activity',
          color: 'bg-red-100 text-red-800',
          dot: 'bg-red-500',
          icon: '🔴'
        };
      default:
        return {
          label: 'Unknown',
          color: 'bg-gray-100 text-gray-600',
          dot: 'bg-gray-400',
          icon: '⚪'
        };
    }
  };

  const config = getStatusConfig(status);

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
        title={`${config.label} • Score: ${engagementScore} • ${totalClicks30d} clicks, ${totalCalls30d} calls (30d)`}
      >
        <span className={`w-2 h-2 rounded-full ${config.dot} mr-1.5`}></span>
        {config.label}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Status Badge */}
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        <span className={`w-2.5 h-2.5 rounded-full ${config.dot} mr-2`}></span>
        {config.icon} {config.label}
        <span className="ml-2 text-xs opacity-75">({engagementScore})</span>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center space-x-4">
            <span>📊 {totalClicks30d} clicks</span>
            <span>📞 {totalCalls30d} calls</span>
            <span>📈 {engagementScore}/100</span>
          </div>
          
          {engagement.lastClick && (
            <div className="text-xs text-gray-500">
              Last activity: {formatTimeAgo(engagement.lastClick)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mini scorecard for CRM tables
 */
interface EngagementScorecardProps {
  engagement?: ClinicEngagement | null;
  onClick?: () => void;
}

export function EngagementScorecard({ engagement, onClick }: EngagementScorecardProps) {
  if (!engagement) {
    return (
      <div className="text-center p-2 border border-gray-200 rounded-lg bg-gray-50">
        <div className="text-xs text-gray-500">No Data</div>
      </div>
    );
  }

  const { status, engagementScore, totalClicks30d, totalCalls30d } = engagement;
  
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'engaged': return '🔵';
      case 'low': return '🟠';
      case 'none': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div 
      className={`text-center p-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
      title={`${status} • ${totalClicks30d} clicks, ${totalCalls30d} calls (30d)`}
    >
      <div className="flex items-center justify-center space-x-1 mb-1">
        <span>{getStatusIcon(status)}</span>
        <span className={`text-lg font-bold ${getScoreColor(engagementScore)}`}>
          {engagementScore}
        </span>
      </div>
      
      <div className="text-xs text-gray-600">
        {totalClicks30d}c • {totalCalls30d}ph
      </div>
    </div>
  );
}

/**
 * Engagement trend indicator
 */
interface EngagementTrendProps {
  current?: ClinicEngagement | null;
  previous?: ClinicEngagement | null;
}

export function EngagementTrend({ current, previous }: EngagementTrendProps) {
  if (!current || !previous) {
    return null;
  }

  const scoreDiff = current.engagementScore - previous.engagementScore;
  const clicksDiff = current.totalClicks30d - previous.totalClicks30d;
  const callsDiff = current.totalCalls30d - previous.totalCalls30d;

  const getTrendIcon = (diff: number) => {
    if (diff > 0) return '📈';
    if (diff < 0) return '📉';
    return '➡️';
  };

  const getTrendColor = (diff: number) => {
    if (diff > 0) return 'text-green-600';
    if (diff < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="text-xs space-y-1">
      <div className={`flex items-center space-x-1 ${getTrendColor(scoreDiff)}`}>
        <span>{getTrendIcon(scoreDiff)}</span>
        <span>Score: {scoreDiff > 0 ? '+' : ''}{scoreDiff}</span>
      </div>
      
      <div className="flex items-center space-x-2 text-gray-600">
        <span className={getTrendColor(clicksDiff)}>
          Clicks: {clicksDiff > 0 ? '+' : ''}{clicksDiff}
        </span>
        <span className={getTrendColor(callsDiff)}>
          Calls: {callsDiff > 0 ? '+' : ''}{callsDiff}
        </span>
      </div>
    </div>
  );
}

/**
 * Bulk engagement status for multiple clinics
 */
interface BulkEngagementStatusProps {
  clinics: Array<{ id: string; engagement?: ClinicEngagement }>;
}

export function BulkEngagementStatus({ clinics }: BulkEngagementStatusProps) {
  const summary = clinics.reduce(
    (acc, clinic) => {
      const status = clinic.engagement?.status || 'none';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { engaged: 0, low: 0, none: 0 } as Record<string, number>
  );

  const total = clinics.length;
  const engagedPercent = Math.round((summary.engaged / total) * 100);
  const lowPercent = Math.round((summary.low / total) * 100);
  const nonePercent = Math.round((summary.none / total) * 100);

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Engagement Overview</h4>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span className="text-sm text-gray-700">Engaged</span>
          </div>
          <span className="text-sm font-medium">{summary.engaged} ({engagedPercent}%)</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
            <span className="text-sm text-gray-700">Low Activity</span>
          </div>
          <span className="text-sm font-medium">{summary.low} ({lowPercent}%)</span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span className="text-sm text-gray-700">No Activity</span>
          </div>
          <span className="text-sm font-medium">{summary.none} ({nonePercent}%)</span>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div className="h-2 rounded-full flex">
          <div 
            className="bg-green-500 rounded-l-full" 
            style={{ width: `${engagedPercent}%` }}
          ></div>
          <div 
            className="bg-yellow-500" 
            style={{ width: `${lowPercent}%` }}
          ></div>
          <div 
            className="bg-red-500 rounded-r-full" 
            style={{ width: `${nonePercent}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Format time ago helper
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}