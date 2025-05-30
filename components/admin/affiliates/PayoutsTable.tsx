import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../../apps/web/lib/firebase';
import { AffiliatePayout } from '../../../lib/models/affiliate';
import Link from 'next/link';

interface PayoutsTableProps {
  period: 'all' | 'current_month' | 'last_month' | 'year_to_date';
  affiliateId?: string;
}

const PayoutsTable: React.FC<PayoutsTableProps> = ({ 
  period, 
  affiliateId 
}) => {
  const [payouts, setPayouts] = useState<AffiliatePayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Create base query
        const payoutsRef = collection(db, 'affiliate_payouts');
        let q = query(
          payoutsRef,
          orderBy('date', 'desc')
        );
        
        // Apply affiliate filter if provided
        if (affiliateId) {
          q = query(q, where('affiliateId', '==', affiliateId));
        }
        
        // Apply date range filter based on period
        if (period !== 'all') {
          let startDate: Date;
          
          if (period === 'current_month') {
            startDate = new Date();
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
          } else if (period === 'last_month') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            
            const endDate = new Date();
            endDate.setDate(0); // Last day of previous month
            endDate.setHours(23, 59, 59, 999);
            
            q = query(q, 
              where('date', '>=', Timestamp.fromDate(startDate)),
              where('date', '<=', Timestamp.fromDate(endDate))
            );
          } else if (period === 'year_to_date') {
            startDate = new Date();
            startDate.setMonth(0, 1); // January 1st of current year
            startDate.setHours(0, 0, 0, 0);
            
            q = query(q, where('date', '>=', Timestamp.fromDate(startDate)));
          }
        }
        
        // Execute the query
        const querySnapshot = await getDocs(q);
        
        // Process results
        const payoutsList: AffiliatePayout[] = [];
        querySnapshot.forEach((doc) => {
          payoutsList.push({ id: doc.id, ...doc.data() } as AffiliatePayout);
        });
        
        setPayouts(payoutsList);
      } catch (err) {
        console.error('Error fetching payouts:', err);
        setError('Failed to load payout data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPayouts();
  }, [period, affiliateId]);
  
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
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded mb-4"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  if (payouts.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">No payouts found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No payout records exist for the selected period.
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Date
            </th>
            {!affiliateId && (
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Affiliate
              </th>
            )}
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Amount
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
              Method
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Reference
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payouts.map((payout) => (
            <tr key={payout.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(payout.date)}
              </td>
              {!affiliateId && (
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/admin/affiliates/${payout.affiliateId}`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-900"
                  >
                    View Affiliate
                  </Link>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {formatCurrency(payout.amount)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payout.status === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : payout.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : payout.status === 'processing'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {payout.referralCount} referrals
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                {payout.method}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {payout.reference || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PayoutsTable;