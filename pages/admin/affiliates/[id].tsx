import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Tab } from '@headlessui/react';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AffiliateHeader from '../../../components/admin/affiliates/AffiliateHeader';
import AffiliateInfoSection from '../../../components/admin/affiliates/AffiliateInfoSection';
import AffiliateReferralsSection from '../../../components/admin/affiliates/AffiliateReferralsSection';
import AffiliatePayoutsSection from '../../../components/admin/affiliates/AffiliatePayoutsSection';
import AffiliateNotesSection from '../../../components/admin/affiliates/AffiliateNotesSection';
import { getAffiliateById } from '../../../lib/api/affiliateService';
import { Affiliate } from '../../../lib/models/affiliate';

const AffiliateDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [affiliate, setAffiliate] = useState<Affiliate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchAffiliate = async () => {
      if (!id || typeof id !== 'string') return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await getAffiliateById(id);
        
        if (!data) {
          setError('Affiliate not found');
          return;
        }
        
        setAffiliate(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load affiliate');
        console.error('Error fetching affiliate:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAffiliate();
  }, [id]);
  
  // Handle tab selection
  const [selectedTab, setSelectedTab] = useState(0);
  const tabs = [
    { name: 'Overview', component: AffiliateInfoSection },
    { name: 'Referrals', component: AffiliateReferralsSection },
    { name: 'Payouts', component: AffiliatePayoutsSection },
    { name: 'Notes & History', component: AffiliateNotesSection }
  ];
  
  function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
  }
  
  if (loading) {
    return (
      <ProtectedRoute adminOnly>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-6 py-1">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }
  
  if (error || !affiliate) {
    return (
      <ProtectedRoute adminOnly>
        <Layout>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white shadow rounded-lg p-6">
              <h1 className="text-red-600 font-semibold text-lg">Error</h1>
              <p className="text-gray-700">{error || 'Affiliate not found'}</p>
              <button
                type="button"
                onClick={() => router.push('/admin/affiliates')}
                className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Return to Affiliates
              </button>
            </div>
          </div>
        </Layout>
      </ProtectedRoute>
    );
  }
  
  return (
    <ProtectedRoute adminOnly>
      <Layout>
        <Head>
          <title>{affiliate.name} | Affiliate Partner | Men&apos;s Health Finder Admin</title>
          <meta name="description" content={`Manage affiliate partner: ${affiliate.name}`} />
        </Head>
        
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            {/* Affiliate Header with basic info and quick actions */}
            <AffiliateHeader affiliate={affiliate} />
            
            {/* Tabs for different sections */}
            <div className="mt-6">
              <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
                  {tabs.map((tab) => (
                    <Tab
                      key={tab.name}
                      className={({ selected }) =>
                        classNames(
                          'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                          'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                          selected
                            ? 'bg-white shadow text-indigo-700'
                            : 'text-gray-700 hover:bg-white/[0.12] hover:text-indigo-600'
                        )
                      }
                    >
                      {tab.name}
                    </Tab>
                  ))}
                </Tab.List>
                <Tab.Panels className="mt-4">
                  {tabs.map((tab, idx) => {
                    const TabComponent = tab.component;
                    return (
                      <Tab.Panel
                        key={idx}
                        className={classNames(
                          'rounded-xl bg-white p-3',
                          'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none'
                        )}
                      >
                        <TabComponent affiliate={affiliate} />
                      </Tab.Panel>
                    );
                  })}
                </Tab.Panels>
              </Tab.Group>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default AffiliateDetailPage;