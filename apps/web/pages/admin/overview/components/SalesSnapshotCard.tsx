import React from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpIcon, ArrowDownIcon, CurrencyDollarIcon, UserPlusIcon, UsersIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { SalesMetrics } from '../../../../utils/metrics/types';

// Use dynamic import with SSR disabled to prevent server-side rendering issues
const SalesSnapshotCard = dynamic(() => Promise.resolve(RawSalesSnapshotCard), {
  ssr: false,
});

interface SalesSnapshotCardProps {
  data: SalesMetrics | null;
  loading: boolean;
  onRefresh: () => void;
}

const RawSalesSnapshotCard: React.FC<SalesSnapshotCardProps> = ({ data, loading, onRefresh }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getChangeIndicator = (value: number, isPositive = true) => {
    const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;
    const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
    
    return (
      <div className={`flex items-center ${colorClass}`}>
        <Icon className="h-4 w-4 mr-1" />
        <span className="text-sm">{value}%</span>
      </div>
    );
  };

  return (
    <div className="bg-[#111111] rounded-2xl shadow-lg border border-[#222222] p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white">Sales Snapshot</h2>
        <button 
          onClick={onRefresh}
          className="text-gray-400 hover:text-gray-300"
          title="Refresh data"
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
      </div>
      
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-20 bg-gray-800 rounded-lg"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-16 bg-gray-800 rounded-lg"></div>
            <div className="h-16 bg-gray-800 rounded-lg"></div>
            <div className="h-16 bg-gray-800 rounded-lg"></div>
            <div className="h-16 bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      ) : !data ? (
        <div className="py-10 text-center">
          <p className="text-gray-400">
            Failed to load sales data. Try refreshing.
          </p>
        </div>
      ) : (
        <>
          {/* Monthly Revenue */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6 border border-blue-100 dark:border-blue-800">
            <div className="flex items-start">
              <div className="mr-4 bg-blue-100 dark:bg-blue-800 p-2 rounded-md">
                <CurrencyDollarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Monthly Revenue</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-white">
                    {formatCurrency(data.totalRevenueThisMonth)}
                  </p>
                  {/* This would be calculated from previous month data */}
                  {getChangeIndicator(12)}
                </div>
              </div>
            </div>
          </div>
          
          {/* Other metrics in a grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Annual Revenue */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Annual Revenue</div>
              <div className="text-xl font-semibold text-white">
                {formatCurrency(data.totalRevenueThisYear)}
              </div>
            </div>
            
            {/* New Signups */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center text-gray-400 text-sm mb-1">
                <UserPlusIcon className="h-4 w-4 mr-1" />
                <span>New Signups</span>
              </div>
              <div className="text-xl font-semibold text-white">
                {data.newSignupsThisMonth}
              </div>
            </div>
            
            {/* Active Subscriptions */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center text-gray-400 text-sm mb-1">
                <UsersIcon className="h-4 w-4 mr-1" />
                <span>Active Subscriptions</span>
              </div>
              <div className="text-xl font-semibold text-white">
                {data.activeSubscriptions}
              </div>
            </div>
            
            {/* Churned Accounts */}
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Churned Accounts</div>
              <div className="text-xl font-semibold text-white">
                {data.churnedSubscriptions}
              </div>
              {data.activeSubscriptions > 0 && (
                <div className="text-sm text-red-500">
                  {((data.churnedSubscriptions / data.activeSubscriptions) * 100).toFixed(1)}% churn rate
                </div>
              )}
            </div>
          </div>
          
          {/* Subscription breakdown */}
          {data.subscriptionsByPlan && Object.keys(data.subscriptionsByPlan).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Subscriptions by Plan</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(data.subscriptionsByPlan).map(([plan, count]) => (
                  <div key={plan} className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="text-xs text-gray-400 mb-1 capitalize">{plan}</div>
                    <div className="text-lg font-medium text-white">{count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SalesSnapshotCard;