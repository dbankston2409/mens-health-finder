import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit, getCountFromServer } from 'firebase/firestore';
import { db } from '../../../apps/web/lib/firebase';

const AffiliateStatsCard: React.FC = () => {
  const [stats, setStats] = useState({
    totalAffiliates: 0,
    activeAffiliates: 0,
    totalReferrals: 0,
    totalConversions: 0,
    conversionRate: 0,
    totalPaid: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Count total affiliates
        const affiliatesRef = collection(db, 'affiliates');
        const totalAffiliatesCount = await getCountFromServer(affiliatesRef);
        
        // Count active affiliates
        const activeAffiliatesQuery = query(
          affiliatesRef,
          where('isActive', '==', true)
        );
        const activeAffiliatesCount = await getCountFromServer(activeAffiliatesQuery);
        
        // Count total referrals
        const referralsRef = collection(db, 'referrals');
        const totalReferralsCount = await getCountFromServer(referralsRef);
        
        // Count total conversions
        const conversionsQuery = query(
          referralsRef,
          where('converted', '==', true)
        );
        const totalConversionsCount = await getCountFromServer(conversionsQuery);
        
        // Calculate conversion rate
        const conversionRate = totalReferralsCount.data().count > 0 
          ? (totalConversionsCount.data().count / totalReferralsCount.data().count) * 100 
          : 0;
        
        // Sum total paid
        const payoutsRef = collection(db, 'affiliate_payouts');
        const payoutsQuery = query(
          payoutsRef,
          where('status', '==', 'completed'),
          orderBy('date', 'desc')
        );
        const payoutsSnapshot = await getDocs(payoutsQuery);
        
        let totalPaid = 0;
        payoutsSnapshot.forEach((doc) => {
          const data = doc.data();
          totalPaid += data.amount || 0;
        });
        
        // Update stats
        setStats({
          totalAffiliates: totalAffiliatesCount.data().count,
          activeAffiliates: activeAffiliatesCount.data().count,
          totalReferrals: totalReferralsCount.data().count,
          totalConversions: totalConversionsCount.data().count,
          conversionRate,
          totalPaid
        });
      } catch (error) {
        console.error('Error fetching affiliate stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Affiliate Statistics</h3>
        <p className="mt-1 text-sm text-gray-500">
          Overview of affiliate program performance
        </p>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        {loading ? (
          <div className="py-8 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Affiliates</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {stats.totalAffiliates.toLocaleString()}
                <span className="ml-2 text-xs text-gray-500">
                  ({stats.activeAffiliates} active)
                </span>
              </dd>
            </div>
            
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Referrals</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {stats.totalReferrals.toLocaleString()}
              </dd>
            </div>
            
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Conversions</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {stats.totalConversions.toLocaleString()}
                <span className="ml-2 text-xs text-gray-500">
                  ({stats.conversionRate.toFixed(1)}% rate)
                </span>
              </dd>
            </div>
            
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Paid</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-medium">
                {formatCurrency(stats.totalPaid)}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
};

export default AffiliateStatsCard;