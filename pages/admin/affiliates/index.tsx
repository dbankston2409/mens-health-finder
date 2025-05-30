import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AffiliateTable from '../../../components/admin/affiliates/AffiliateTable';
import AffiliateStatsCard from '../../../components/admin/affiliates/AffiliateStatsCard';
import AffiliateFilters from '../../../components/admin/affiliates/AffiliateFilters';
import { AffiliateType } from '../../../lib/models/affiliate';

const AffiliatesPage: React.FC = () => {
  const router = useRouter();
  const [filters, setFilters] = useState<{
    type?: AffiliateType;
    isActive?: boolean;
    searchTerm?: string;
  }>({});
  
  // Handle filter changes
  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };
  
  return (
    <ProtectedRoute adminOnly>
      <Layout>
        <Head>
          <title>Affiliate Partners | Men&apos;s Health Finder Admin</title>
          <meta name="description" content="Manage affiliate partners and referrals" />
        </Head>
        
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Affiliate Partners</h1>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/affiliates/new')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Affiliate
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/admin/affiliates/payouts')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Manage Payouts
                </button>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="space-y-6">
                  {/* Stats Card */}
                  <AffiliateStatsCard />
                  
                  {/* Filters */}
                  <AffiliateFilters 
                    filters={filters}
                    onFilterChange={handleFilterChange}
                  />
                </div>
              </div>
              
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">About Affiliate Partners</h2>
                  <p className="text-sm text-gray-600">
                    The Affiliate Partner system allows you to track referrals from influencers, media partners, 
                    and other sources. Create and manage affiliate codes, track referral performance, and process payouts.
                  </p>
                </div>
                
                <AffiliateTable filters={filters} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default AffiliatesPage;