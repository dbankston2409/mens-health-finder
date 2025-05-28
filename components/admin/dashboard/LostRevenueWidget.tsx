import React, { useState, useEffect } from 'react';
import { ExclamationTriangleIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, PhoneIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSeoIndexStatus } from '../../../apps/web/utils/hooks/useSeoIndexStatus';
import { calculateLostRevenue } from '../../../utils/admin/calculateLostRevenue';

interface LostRevenueData {
  totalLostRevenue: number;
  breakdown: {
    notIndexed: number;
    noCallTracking: number;
    basicTier: number;
    missingContent: number;
    seoGaps: number;
    upgradesMissed: number;
  };
  topOpportunities: {
    clinicId: string;
    clinicName: string;
    estimatedLoss: number;
    issue: string;
    recommendation: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
  summary: {
    missedCalls: number;
    missedClicks: number;
    missedUpgrades: number;
  };
}

export function LostRevenueWidget() {
  const { clinics, loading, error } = useSeoIndexStatus();
  const [revenueData, setRevenueData] = useState<LostRevenueData | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    if (clinics.length > 0) {
      const calculated = calculateLostRevenue(clinics);
      setRevenueData(calculated);
    }
  }, [clinics]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getIssueColor = (issue: string, severity?: string) => {
    if (severity) {
      switch (severity) {
        case 'critical':
          return 'text-red-600 bg-red-50 border-red-200';
        case 'high':
          return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'medium':
          return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'low':
          return 'text-blue-600 bg-blue-50 border-blue-200';
        default:
          return 'text-gray-600 bg-gray-50 border-gray-200';
      }
    }
    
    switch (issue) {
      case 'Not Indexed':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Basic Tier':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Missing Content':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'No Call Tracking':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'SEO Gaps':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'Upgrade Opportunity':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !revenueData) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="text-red-600">
          <h3 className="text-lg font-medium mb-2">Error Loading Revenue Data</h3>
          <p className="text-sm">{error || 'Unable to calculate lost revenue'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Lost Revenue Analysis</h3>
          <p className="text-sm text-gray-600">Estimated monthly opportunity</p>
        </div>
        <ExclamationTriangleIcon className="h-6 w-6 text-amber-500" />
      </div>

      {/* Main Revenue Loss Display */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-red-600">
              {formatCurrency(revenueData.totalLostRevenue)}
            </div>
            <div className="text-sm text-gray-700 mt-1">
              You're losing an estimated {formatCurrency(revenueData.totalLostRevenue)}/mo in missed leads
            </div>
          </div>
          <div className="text-right">
            <CurrencyDollarIcon className="h-12 w-12 text-red-500 opacity-60" />
          </div>
        </div>
        
        {/* Quick Stats */}
        {revenueData.summary && (
          <div className="mt-4 pt-4 border-t border-red-100">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-600">
                  <PhoneIcon className="h-4 w-4" />
                  <span className="font-bold">{revenueData.summary.missedCalls}</span>
                </div>
                <div className="text-gray-600">Missed Calls</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-600">
                  <MagnifyingGlassIcon className="h-4 w-4" />
                  <span className="font-bold">{revenueData.summary.missedClicks}</span>
                </div>
                <div className="text-gray-600">Lost Traffic</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-red-600">
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                  <span className="font-bold">{revenueData.summary.missedUpgrades}</span>
                </div>
                <div className="text-gray-600">Upgrades</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Breakdown Toggle */}
      <button
        onClick={() => setShowBreakdown(!showBreakdown)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-4"
      >
        <span className="text-sm font-medium text-gray-700">
          View Revenue Loss Breakdown
        </span>
        <ArrowTrendingUpIcon className={`h-4 w-4 text-gray-500 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
      </button>

      {/* Breakdown Details */}
      {showBreakdown && (
        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-red-600">
                {formatCurrency(revenueData.breakdown.notIndexed)}
              </div>
              <div className="text-xs text-gray-600">Not Indexed</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-purple-600">
                {formatCurrency(revenueData.breakdown.noCallTracking)}
              </div>
              <div className="text-xs text-gray-600">No Call Tracking</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(revenueData.breakdown.seoGaps || 0)}
              </div>
              <div className="text-xs text-gray-600">SEO Gaps</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(revenueData.breakdown.upgradesMissed || 0)}
              </div>
              <div className="text-xs text-gray-600">Missed Upgrades</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-yellow-600">
                {formatCurrency(revenueData.breakdown.basicTier)}
              </div>
              <div className="text-xs text-gray-600">Basic Tier Limits</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-lg font-bold text-orange-600">
                {formatCurrency(revenueData.breakdown.missingContent)}
              </div>
              <div className="text-xs text-gray-600">Missing Content</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Opportunities */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Top Revenue Opportunities</h4>
        <div className="space-y-3">
          {revenueData.topOpportunities.slice(0, 3).map((opportunity, index) => (
            <div key={opportunity.clinicId} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {opportunity.clinicName}
                  </span>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getIssueColor(opportunity.issue, opportunity.severity)}`}>
                    {opportunity.issue}
                  </span>
                </div>
                <div className="text-sm font-bold text-red-600">
                  {formatCurrency(opportunity.estimatedLoss)}/mo
                </div>
              </div>
              <div className="text-xs text-gray-600">
                <strong>Action:</strong> {opportunity.recommendation}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => window.open('/admin/reports/revenue-leakage', '_blank')}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            <MagnifyingGlassIcon className="h-4 w-4 mr-1" />
            Fix SEO Issues
          </button>
          <button 
            onClick={() => window.open('/admin/crm?filter=no-call-tracking', '_blank')}
            className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
          >
            <PhoneIcon className="h-4 w-4 mr-1" />
            Add Call Tracking
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50">
            Export Report
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          * Revenue estimates based on industry averages and clinic performance data. 
          Actual results may vary based on market conditions and implementation.
        </p>
      </div>
    </div>
  );
}