import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  UserIcon, 
  NewspaperIcon, 
  BuildingStorefrontIcon, 
  UsersIcon, 
  BriefcaseIcon 
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  ClipboardIcon,
  ArrowPathIcon,
  LinkIcon
} from '@heroicons/react/24/solid';
import { Affiliate, AffiliateType } from '../../../lib/models/affiliate';
import { updateAffiliate } from '../../../lib/api/affiliateService';

interface AffiliateHeaderProps {
  affiliate: Affiliate;
}

const AffiliateHeader: React.FC<AffiliateHeaderProps> = ({ affiliate }) => {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
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
  
  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Toggle active status
  const toggleActiveStatus = async () => {
    if (isToggling || !affiliate.id) return;
    
    try {
      setIsToggling(true);
      await updateAffiliate(affiliate.id, {
        isActive: !affiliate.isActive
      });
      
      // Force refresh
      router.reload();
    } catch (error) {
      console.error('Error toggling affiliate status:', error);
      alert('Failed to update affiliate status.');
    } finally {
      setIsToggling(false);
    }
  };
  
  // Copy affiliate link to clipboard
  const copyAffiliateLink = () => {
    const baseUrl = window.location.origin;
    const affiliateLink = `${baseUrl}?ref=${affiliate.code}`;
    
    navigator.clipboard.writeText(affiliateLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch((err) => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  };
  
  // Create short link for affiliate
  const createShortLink = () => {
    // This would be implemented with an actual URL shortener service
    alert('Short link feature coming soon!');
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <div className="flex justify-between">
          <div className="flex items-center">
            <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center">
              {getAffiliateTypeIcon(affiliate.type)}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-bold text-gray-900">
                {affiliate.name}
              </h2>
              <div className="flex items-center text-sm text-gray-500">
                <span 
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                    affiliate.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {affiliate.isActive ? 'Active' : 'Inactive'}
                </span>
                <span className="mr-2">Code: <span className="font-mono font-medium">{affiliate.code}</span></span>
                <span className="capitalize">{affiliate.type}</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => router.push(`/admin/affiliates/edit/${affiliate.id}`)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              type="button"
              onClick={toggleActiveStatus}
              disabled={isToggling}
              className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                affiliate.isActive
                  ? 'border-red-300 text-red-700 bg-white hover:bg-red-50 focus:ring-red-500'
                  : 'border-green-300 text-green-700 bg-white hover:bg-green-50 focus:ring-green-500'
              } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isToggling ? (
                <ArrowPathIcon className="animate-spin h-4 w-4 mr-1" />
              ) : affiliate.isActive ? (
                <XCircleIcon className="h-4 w-4 mr-1" />
              ) : (
                <CheckCircleIcon className="h-4 w-4 mr-1" />
              )}
              {affiliate.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-xs font-medium text-gray-500 uppercase">Referral Clicks</div>
            <div className="mt-1 text-2xl font-semibold">{affiliate.stats.referralClicks.toLocaleString()}</div>
            {affiliate.stats.lastReferral && (
              <div className="text-xs text-gray-500">Last: {formatDate(affiliate.stats.lastReferral)}</div>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-xs font-medium text-gray-500 uppercase">Conversions</div>
            <div className="mt-1 text-2xl font-semibold">{affiliate.stats.conversionCount.toLocaleString()}</div>
            {affiliate.stats.conversionCount > 0 && affiliate.stats.referralClicks > 0 && (
              <div className="text-xs text-gray-500">
                Rate: {((affiliate.stats.conversionCount / affiliate.stats.referralClicks) * 100).toFixed(1)}%
              </div>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-xs font-medium text-gray-500 uppercase">Total Paid</div>
            <div className="mt-1 text-2xl font-semibold">{formatCurrency(affiliate.stats.totalPaid)}</div>
            {affiliate.stats.lastPayout && (
              <div className="text-xs text-gray-500">
                Last: {formatCurrency(affiliate.stats.lastPayout.amount)} ({formatDate(affiliate.stats.lastPayout.date)})
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copyAffiliateLink}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isCopied ? (
              <>
                <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <ClipboardIcon className="h-4 w-4 mr-1" />
                Copy Referral Link
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={createShortLink}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <LinkIcon className="h-4 w-4 mr-1" />
            Create Short Link
          </button>
          
          <button
            type="button"
            onClick={() => router.push(`/admin/affiliates/payouts/${affiliate.id}`)}
            className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Process Payout
          </button>
        </div>
      </div>
    </div>
  );
};

export default AffiliateHeader;