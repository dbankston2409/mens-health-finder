import React, { useState, useEffect } from 'react';
import { getAffiliateReferrals } from '../../../lib/api/affiliateService';
import { Affiliate, AffiliateReferral } from '../../../lib/models/affiliate';

interface AffiliateReferralsSectionProps {
  affiliate: Affiliate;
}

const AffiliateReferralsSection: React.FC<AffiliateReferralsSectionProps> = ({ affiliate }) => {
  const [referrals, setReferrals] = useState<AffiliateReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [timeRange, setTimeRange] = useState<'all' | '30days' | '7days' | 'today'>('30days');
  const [conversionFilter, setConversionFilter] = useState<'all' | 'converted' | 'not_converted'>('all');
  
  useEffect(() => {
    const fetchReferrals = async () => {
      if (!affiliate.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Set date range based on filter
        const options: Parameters<typeof getAffiliateReferrals>[1] = {};
        
        if (timeRange === '30days') {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          options.startDate = startDate;
        } else if (timeRange === '7days') {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          options.startDate = startDate;
        } else if (timeRange === 'today') {
          const startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          options.startDate = startDate;
        }
        
        // Set conversion filter
        if (conversionFilter === 'converted') {
          options.converted = true;
        } else if (conversionFilter === 'not_converted') {
          options.converted = false;
        }
        
        // Get referrals
        const data = await getAffiliateReferrals(affiliate.id, options);
        setReferrals(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load referrals'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchReferrals();
  }, [affiliate.id, timeRange, conversionFilter]);
  
  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Format target type for display
  const formatTargetType = (type: string) => {
    switch (type) {
      case 'clinic':
        return 'Clinic Profile';
      case 'signup':
        return 'Signup Page';
      case 'blog':
        return 'Blog Post';
      case 'homepage':
        return 'Homepage';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Format conversion type for display
  const formatConversionType = (type?: string) => {
    if (!type) return 'None';
    
    switch (type) {
      case 'view':
        return 'Page View';
      case 'call':
        return 'Phone Call';
      case 'website_click':
        return 'Website Click';
      case 'signup':
        return 'Signup';
      case 'tier_upgrade':
        return 'Tier Upgrade';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Referral History
            </h3>
            
            <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
              {/* Time Range Filter */}
              <div>
                <label htmlFor="timeRange" className="sr-only">Time Range</label>
                <select
                  id="timeRange"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Time</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="today">Today</option>
                </select>
              </div>
              
              {/* Conversion Filter */}
              <div>
                <label htmlFor="conversionFilter" className="sr-only">Conversion Filter</label>
                <select
                  id="conversionFilter"
                  value={conversionFilter}
                  onChange={(e) => setConversionFilter(e.target.value as any)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                  <option value="all">All Referrals</option>
                  <option value="converted">Converted Only</option>
                  <option value="not_converted">Not Converted</option>
                </select>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="py-8 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          ) : error ? (
            <div className="py-4 px-6 bg-red-50 text-red-700 rounded-md mt-4">
              <p>Error loading referrals: {error.message}</p>
            </div>
          ) : referrals.length === 0 ? (
            <div className="py-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No referrals found</h3>
              <p className="mt-1 text-sm text-gray-500">
                This affiliate hasn't generated any referrals in the selected time period.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Target
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Conversion
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Value
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Paid
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(referral.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">
                            {formatTargetType(referral.targetType)}
                          </span>
                          <a 
                            href={referral.targetUrl}
                            target="_blank"
                            rel="noopener noreferrer" 
                            className="text-xs text-indigo-600 hover:text-indigo-900 truncate max-w-xs"
                          >
                            {referral.targetUrl}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {referral.converted ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Converted
                            </span>
                            <span className="text-xs text-gray-500 mt-1">
                              {formatConversionType(referral.conversionType)}
                            </span>
                            {referral.conversionTimestamp && (
                              <span className="text-xs text-gray-500">
                                {formatDate(referral.conversionTimestamp)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Converted
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {referral.conversionValue ? (
                          <span className="font-medium">${referral.conversionValue.toFixed(2)}</span>
                        ) : (
                          <span>$0.00</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {referral.isPaid ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AffiliateReferralsSection;