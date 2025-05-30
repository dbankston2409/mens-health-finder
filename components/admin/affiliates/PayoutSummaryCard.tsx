import React, { useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../../apps/web/lib/firebase';

interface PayoutSummaryCardProps {
  period: 'all' | 'current_month' | 'last_month' | 'year_to_date';
  affiliateId?: string;
}

interface PayoutSummary {
  totalPaid: number;
  pendingAmount: number;
  affiliateCount: number;
  referralCount: number;
  conversionCount: number;
}

const PayoutSummaryCard: React.FC<PayoutSummaryCardProps> = ({ 
  period, 
  affiliateId 
}) => {
  const [summary, setSummary] = useState<PayoutSummary>({
    totalPaid: 0,
    pendingAmount: 0,
    affiliateCount: 0,
    referralCount: 0,
    conversionCount: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        
        // Get date range for the period
        let startDate: Date | null = null;
        let endDate: Date | null = null;
        
        if (period !== 'all') {
          const now = new Date();
          
          if (period === 'current_month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          } else if (period === 'last_month') {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          } else if (period === 'year_to_date') {
            startDate = new Date(now.getFullYear(), 0, 1);
          }
        }
        
        // Get completed payouts
        const payoutsRef = collection(db, 'affiliate_payouts');
        let completedQuery: any = query(
          payoutsRef,
          where('status', '==', 'completed')
        );
        
        // Apply date filter if applicable
        if (startDate) {
          completedQuery = query(
            completedQuery,
            where('date', '>=', Timestamp.fromDate(startDate))
          );
        }
        
        if (endDate) {
          completedQuery = query(
            completedQuery,
            where('date', '<=', Timestamp.fromDate(endDate))
          );
        }
        
        // Apply affiliate filter if applicable
        if (affiliateId) {
          completedQuery = query(
            completedQuery,
            where('affiliateId', '==', affiliateId)
          );
        }
        
        // Get pending payouts
        let pendingQuery: any = query(
          payoutsRef,
          where('status', 'in', ['pending', 'processing'])
        );
        
        // Apply date filter if applicable
        if (startDate) {
          pendingQuery = query(
            pendingQuery,
            where('date', '>=', Timestamp.fromDate(startDate))
          );
        }
        
        if (endDate) {
          pendingQuery = query(
            pendingQuery,
            where('date', '<=', Timestamp.fromDate(endDate))
          );
        }
        
        // Apply affiliate filter if applicable
        if (affiliateId) {
          pendingQuery = query(
            pendingQuery,
            where('affiliateId', '==', affiliateId)
          );
        }
        
        // Execute queries
        const [completedSnap, pendingSnap] = await Promise.all([
          getDocs(completedQuery),
          getDocs(pendingQuery)
        ]);
        
        // Process completed payouts
        let totalPaid = 0;
        const uniqueAffiliates = new Set<string>();
        let totalReferralCount = 0;
        
        completedSnap.forEach((doc) => {
          const data = doc.data();
          totalPaid += data.amount || 0;
          uniqueAffiliates.add(data.affiliateId);
          totalReferralCount += data.referralCount || 0;
        });
        
        // Process pending payouts
        let pendingAmount = 0;
        
        pendingSnap.forEach((doc) => {
          const data = doc.data();
          pendingAmount += data.amount || 0;
          uniqueAffiliates.add(data.affiliateId);
          totalReferralCount += data.referralCount || 0;
        });
        
        // Get conversion count from referrals
        const referralsRef = collection(db, 'referrals');
        let convertedQuery: any = query(
          referralsRef,
          where('converted', '==', true)
        );
        
        // Apply date filter if applicable
        if (startDate) {
          convertedQuery = query(
            convertedQuery,
            where('conversionTimestamp', '>=', Timestamp.fromDate(startDate))
          );
        }
        
        if (endDate) {
          convertedQuery = query(
            convertedQuery,
            where('conversionTimestamp', '<=', Timestamp.fromDate(endDate))
          );
        }
        
        // Apply affiliate filter if applicable
        if (affiliateId) {
          convertedQuery = query(
            convertedQuery,
            where('affiliateId', '==', affiliateId)
          );
        }
        
        const convertedSnap = await getDocs(convertedQuery);
        
        // Update summary
        setSummary({
          totalPaid,
          pendingAmount,
          affiliateCount: uniqueAffiliates.size,
          referralCount: totalReferralCount,
          conversionCount: convertedSnap.size
        });
      } catch (error) {
        console.error('Error fetching payout summary:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, [period, affiliateId]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Get period display text
  const getPeriodText = () => {
    switch (period) {
      case 'current_month':
        return 'Current Month';
      case 'last_month':
        return 'Last Month';
      case 'year_to_date':
        return 'Year to Date';
      default:
        return 'All Time';
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Payout Summary</h3>
        <p className="mt-1 text-sm text-gray-500">
          {getPeriodText()} payout statistics
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
              <dt className="text-sm font-medium text-gray-500">Total Paid</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-bold">
                {formatCurrency(summary.totalPaid)}
              </dd>
            </div>
            
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Pending Payouts</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {formatCurrency(summary.pendingAmount)}
              </dd>
            </div>
            
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Affiliates Paid</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {summary.affiliateCount}
              </dd>
            </div>
            
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Referrals</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {summary.referralCount.toLocaleString()}
              </dd>
            </div>
            
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Conversions</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {summary.conversionCount.toLocaleString()}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
};

export default PayoutSummaryCard;