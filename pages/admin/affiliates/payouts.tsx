import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import PayoutsTable from '../../../components/admin/affiliates/PayoutsTable';
import PayoutSummaryCard from '../../../components/admin/affiliates/PayoutSummaryCard';
import CreatePayoutModal from '../../../components/admin/affiliates/CreatePayoutModal';

const AffiliatePayoutsPage: React.FC = () => {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'current_month' | 'last_month' | 'year_to_date'>('current_month');

  const handleCreatePayout = () => {
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
  };

  return (
    <ProtectedRoute adminOnly>
      <Layout>
        <Head>
          <title>Affiliate Payouts | Men&apos;s Health Finder Admin</title>
          <meta name="description" content="Manage affiliate partner payouts" />
        </Head>
        
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Affiliate Payouts</h1>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleCreatePayout}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Create Payout
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/affiliates')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back to Affiliates
                </button>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="space-y-6">
                  {/* Payout Summary */}
                  <PayoutSummaryCard period={periodFilter} />
                  
                  {/* Period Filter */}
                  <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900">Period Filter</h3>
                    </div>
                    <div className="p-4">
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Select Period
                        </label>
                        <select
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={periodFilter}
                          onChange={(e) => setPeriodFilter(e.target.value as any)}
                        >
                          <option value="current_month">Current Month</option>
                          <option value="last_month">Last Month</option>
                          <option value="year_to_date">Year to Date</option>
                          <option value="all">All Time</option>
                        </select>
                      </div>
                      
                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => router.push('/admin/affiliates/export-csv')}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Export to CSV
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">Payout History</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    View all affiliate payouts and their status. Create new payouts for pending referrals.
                  </p>
                  
                  <PayoutsTable period={periodFilter} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Create Payout Modal */}
        {showCreateModal && (
          <CreatePayoutModal onClose={handleCloseModal} />
        )}
      </Layout>
    </ProtectedRoute>
  );
};

export default AffiliatePayoutsPage;