import React from 'react';
import { TAG_RULES } from '../../apps/worker/utils/tagRuleLibrary';

interface TagBadgeClusterProps {
  tags: string[];
  seoScore?: number;
  compact?: boolean;
  onClick?: (tag: string) => void;
  maxVisible?: number;
}

/**
 * Display a cluster of colored tag badges for clinic issues
 */
export function TagBadgeCluster({ 
  tags = [], 
  seoScore, 
  compact = false, 
  onClick,
  maxVisible = 5 
}: TagBadgeClusterProps) {
  if (tags.length === 0) {
    return (
      <div className="flex items-center space-x-2">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ✓ No Issues
        </span>
        {seoScore !== undefined && (
          <span className="text-xs text-gray-500">
            Score: {seoScore}
          </span>
        )}
      </div>
    );
  }

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visibleTags.map((tagId) => {
        const rule = TAG_RULES.find(r => r.id === tagId);
        if (!rule) return null;

        const badgeStyles = getBadgeStyles(rule.severity);
        const displayName = compact ? getCompactName(rule.name) : rule.name;

        return (
          <div
            key={tagId}
            onClick={() => onClick?.(tagId)}
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors hover:opacity-80 ${
              badgeStyles
            } ${
              onClick ? 'hover:shadow-sm' : ''
            }`}
            title={rule.description}
          >
            {getSeverityIcon(rule.severity)}
            <span className={compact ? 'hidden sm:inline ml-1' : 'ml-1'}>
              {displayName}
            </span>
          </div>
        );
      })}
      
      {hiddenCount > 0 && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          +{hiddenCount} more
        </span>
      )}
      
      {seoScore !== undefined && (
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          getScoreBadgeStyles(seoScore)
        }`}>
          {seoScore}
        </div>
      )}
    </div>
  );
}

/**
 * Get badge styles based on severity
 */
function getBadgeStyles(severity: string): string {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border border-red-200';
    case 'high':
      return 'bg-orange-100 text-orange-800 border border-orange-200';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border border-gray-200';
  }
}

/**
 * Get severity icon
 */
function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'critical':
      return '❌';
    case 'high':
      return '🔴';
    case 'medium':
      return '🟡';
    case 'low':
      return '🔵';
    default:
      return 'ℹ️';
  }
}

/**
 * Get compact version of tag names
 */
function getCompactName(name: string): string {
  const compactMap: Record<string, string> = {
    'Not Indexed': 'No Index',
    'SEO Incomplete': 'SEO',
    'Traffic Dead': 'No Traffic',
    'No Call Action': 'No CTA',
    'Missing Address': 'Address',
    'Ghost Clinic': 'Ghost',
    'Low Engagement': 'Low Eng',
    'Duplicate Content': 'Duplicate',
    'Missing Package': 'Package',
    'Outdated Content': 'Outdated'
  };
  
  return compactMap[name] || name;
}

/**
 * Get score badge styles based on SEO score
 */
function getScoreBadgeStyles(score: number): string {
  if (score >= 90) {
    return 'bg-green-100 text-green-800 border border-green-200';
  } else if (score >= 70) {
    return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  } else if (score >= 50) {
    return 'bg-orange-100 text-orange-800 border border-orange-200';
  } else {
    return 'bg-red-100 text-red-800 border border-red-200';
  }
}

/**
 * Simple tag badge component for individual tags
 */
export function TagBadge({ tag, onClick }: { tag: string; onClick?: () => void }) {
  const rule = TAG_RULES.find(r => r.id === tag);
  if (!rule) return null;

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium cursor-pointer ${
        getBadgeStyles(rule.severity)
      }`}
      title={rule.description}
    >
      {getSeverityIcon(rule.severity)}
      <span className="ml-1">{rule.name}</span>
    </span>
  );
}