import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  UserIcon, 
  NewspaperIcon, 
  BuildingStorefrontIcon, 
  UsersIcon, 
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import { getAllAffiliates } from '../../../lib/api/affiliateService';
import { Affiliate, AffiliateType } from '../../../lib/models/affiliate';

interface AffiliateTableProps {
  filters?: {
    type?: AffiliateType;
    isActive?: boolean;
    searchTerm?: string;
  };
}

const AffiliateTable: React.FC<AffiliateTableProps> = ({ filters = {} }) => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        setLoading(true);
        const options: any = {};
        
        if (filters.type) {
          options.type = filters.type;
        }
        
        if (filters.isActive !== undefined) {
          options.isActive = filters.isActive;
        }
        
        const data = await getAllAffiliates(options);
        
        // Apply search term filter client-side
        let filteredData = data;
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          filteredData = data.filter(
            affiliate => 
              affiliate.name.toLowerCase().includes(searchLower) ||
              affiliate.code.toLowerCase().includes(searchLower) ||
              affiliate.email.toLowerCase().includes(searchLower)
          );
        }
        
        setAffiliates(filteredData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load affiliates'));
      } finally {
        setLoading(false);
      }
    };
    
    fetchAffiliates();
  }, [filters]);
  
  // Get icon for affiliate type
  const getAffiliateTypeIcon = (type: AffiliateType) => {
    switch (type) {
      case 'influencer':
        return <UserIcon className="h-5 w-5 text-purple-500" />;
      case 'media':
        return <NewspaperIcon className="h-5 w-5 text-blue-500" />;
      case 'clinic':
        return <BuildingStorefrontIcon className="h-5 w-5 text-green-500" />;
      case 'partner':
        return <BriefcaseIcon className="h-5 w-5 text-orange-500" />;
      case 'employee':
        return <UsersIcon className="h-5 w-5 text-red-500" />;
      default:
        return <UserIcon className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="animate-pulse px-4 py-6">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="grid grid-cols-5 gap-4">
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
                <div className="h-4 bg-gray-200 rounded col-span-1"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-md p-1">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading affiliates</h3>
              <p className="text-sm text-red-700 mt-1">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (affiliates.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6 text-center">
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No affiliates found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new affiliate partner.
          </p>
          <div className="mt-6">
            <Link
              href="/admin/affiliates/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Affiliate
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Affiliate
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Code
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Referrals
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Payout Tier
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Created
              </th>
              <th
                scope="col"
                className="relative px-6 py-3"
              >
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {affiliates.map((affiliate) => (
              <tr key={affiliate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {getAffiliateTypeIcon(affiliate.type)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {affiliate.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {affiliate.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono font-medium text-gray-900">
                    {affiliate.code}
                  </div>
                  <div className="text-xs text-gray-500">
                    ?ref={affiliate.code}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {getAffiliateTypeIcon(affiliate.type)}
                    <span className="ml-1 text-sm text-gray-900 capitalize">
                      {affiliate.type}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${affiliate.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {affiliate.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{affiliate.stats.referralClicks}</span>
                    <span className="text-xs">
                      {affiliate.stats.conversionCount} conversions
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${affiliate.payoutTier === 'elite' ? 'bg-purple-100 text-purple-800' : 
                      affiliate.payoutTier === 'premium' ? 'bg-blue-100 text-blue-800' : 
                      affiliate.payoutTier === 'custom' ? 'bg-orange-100 text-orange-800' : 
                      'bg-green-100 text-green-800'}`}
                  >
                    {affiliate.payoutTier.charAt(0).toUpperCase() + affiliate.payoutTier.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(affiliate.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link href={`/admin/affiliates/${affiliate.id}`} className="text-indigo-600 hover:text-indigo-900">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AffiliateTable;