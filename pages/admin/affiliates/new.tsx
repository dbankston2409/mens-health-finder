import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AffiliateForm from '../../../components/admin/affiliates/AffiliateForm';
import { createAffiliate } from '../../../lib/api/affiliateService';
import { AffiliateType, PayoutTier } from '../../../lib/models/affiliate';

const NewAffiliatePage: React.FC = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Handle form submission
  const handleSubmit = async (data: {
    name: string;
    email: string;
    code: string;
    website?: string;
    phone?: string;
    type: AffiliateType;
    payoutTier: PayoutTier;
    isActive: boolean;
    notes?: string;
  }) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create new affiliate
      const affiliateId = await createAffiliate(data);
      
      // Redirect to the affiliate details page
      router.push(`/admin/affiliates/${affiliateId}`);
    } catch (err) {
      console.error('Error creating affiliate:', err);
      setError(err instanceof Error ? err.message : 'Failed to create affiliate');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <ProtectedRoute adminOnly>
      <Layout>
        <Head>
          <title>New Affiliate Partner | Men&apos;s Health Finder Admin</title>
          <meta name="description" content="Create a new affiliate partner" />
        </Head>
        
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">New Affiliate Partner</h1>
              <button
                type="button"
                onClick={() => router.push('/admin/affiliates')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>
            
            <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <AffiliateForm 
                onSubmit={handleSubmit} 
                isSubmitting={isSubmitting} 
              />
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default NewAffiliatePage;