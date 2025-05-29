import React from 'react';
import { Tooltip } from './Tooltip';

interface TierBadgeProps {
  tier: 'free' | 'standard' | 'advanced' | 'low' | 'high';
  size?: 'sm' | 'md' | 'lg';
}

const TierBadge: React.FC<TierBadgeProps> = ({ tier, size = 'md' }) => {
  let badgeText = '';
  let badgeColor = '';
  let tooltipText = '';
  
  // Map legacy tier values to new tier system
  const normalizedTier = 
    tier === 'high' ? 'advanced' :
    tier === 'low' ? 'standard' :
    tier;
  
  switch (normalizedTier) {
    case 'advanced':
      badgeText = 'VERIFIED ADVANCED PROVIDER';
      badgeColor = 'bg-gradient-to-r from-yellow-600 to-yellow-400';
      tooltipText = 'This provider has completed our advanced verification process and maintains a premium listing on Men\'s Health Finder.';
      break;
    case 'standard':
      badgeText = 'VERIFIED PROVIDER';
      badgeColor = 'bg-green-600';
      tooltipText = 'This provider has completed verification through Men\'s Health Finder.';
      break;
    case 'free':
    default:
      badgeText = 'NOT YET VERIFIED';
      badgeColor = 'bg-gray-500';
      tooltipText = 'This provider has not yet completed verification through Men\'s Health Finder.';
      break;
  }
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5'
  };
  
  return (
    <Tooltip content={tooltipText}>
      <span className={`${badgeColor} text-white font-bold ${sizeClasses[size]} rounded inline-flex items-center`}>
        {normalizedTier === 'advanced' && (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )}
        {badgeText}
      </span>
    </Tooltip>
  );
};

export default TierBadge;