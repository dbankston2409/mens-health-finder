import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../../apps/web/lib/firebase';
import { getAllAffiliates, createAffiliatePayout } from '../../../lib/api/affiliateService';
import { Affiliate } from '../../../lib/models/affiliate';

interface CreatePayoutModalProps {
  onClose: () => void;
  affiliateId?: string;
}

const CreatePayoutModal: React.FC<CreatePayoutModalProps> = ({ onClose, affiliateId }) => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [selectedAffiliateId, setSelectedAffiliateId] = useState<string>(affiliateId || '');
  const [loading, setLoading] = useState(true);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    end: new Date().toISOString().split('T')[0] // Today
  });
  const [referralSummary, setReferralSummary] = useState({
    totalReferrals: 0,
    convertedReferrals: 0,
    unpaidAmount: 0
  });
  const [payoutData, setPayoutData] = useState({
    amount: 0,
    currency: 'USD',
    method: 'paypal' as const,
    reference: '',
    notes: ''
  });
  
  // Load affiliates
  useEffect(() => {
    const fetchAffiliates = async () => {
      try {
        setLoading(true);
        
        // Fetch active affiliates
        const activeAffiliates = await getAllAffiliates({ isActive: true });
        setAffiliates(activeAffiliates);
        
        // Set default selected affiliate
        if (affiliateId) {
          setSelectedAffiliateId(affiliateId);
        } else if (activeAffiliates.length > 0) {
          setSelectedAffiliateId(activeAffiliates[0].id || '');
        }
      } catch (error) {
        console.error('Error fetching affiliates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAffiliates();
  }, [affiliateId]);
  
  // Load referrals when affiliate changes
  useEffect(() => {
    if (!selectedAffiliateId) return;
    
    const fetchReferrals = async () => {
      try {
        setLoadingReferrals(true);
        
        // Create date range objects
        const startDate = new Date(dateRange.start);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        
        // Get converted, unpaid referrals for the selected affiliate in the date range
        const referralsRef = collection(db, 'referrals');
        const q = query(
          referralsRef,
          where('affiliateId', '==', selectedAffiliateId),
          where('conversionTimestamp', '>=', Timestamp.fromDate(startDate)),
          where('conversionTimestamp', '<=', Timestamp.fromDate(endDate)),
          where('converted', '==', true),
          where('isPaid', '==', false)
        );
        
        const querySnapshot = await getDocs(q);
        
        // Calculate summary
        let totalValue = 0;
        const referralIds: string[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          totalValue += data.conversionValue || 0;
          referralIds.push(doc.id);
        });
        
        // Get total referrals in date range
        const totalRefQuery = query(
          referralsRef,
          where('affiliateId', '==', selectedAffiliateId),
          where('timestamp', '>=', Timestamp.fromDate(startDate)),
          where('timestamp', '<=', Timestamp.fromDate(endDate))
        );
        
        const totalRefQuerySnapshot = await getDocs(totalRefQuery);
        
        // Update summary
        setReferralSummary({
          totalReferrals: totalRefQuerySnapshot.size,
          convertedReferrals: querySnapshot.size,
          unpaidAmount: totalValue
        });
        
        // Update payout amount
        setPayoutData(prev => ({
          ...prev,
          amount: totalValue
        }));
      } catch (error) {
        console.error('Error fetching referrals:', error);
      } finally {
        setLoadingReferrals(false);
      }
    };
    
    fetchReferrals();
  }, [selectedAffiliateId, dateRange]);
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPayoutData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) : value
    }));
  };
  
  // Handle date range changes
  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle affiliate selection
  const handleAffiliateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAffiliateId(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedAffiliateId || payoutData.amount <= 0) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Create date range objects
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      // Get referral IDs
      const referralsRef = collection(db, 'referrals');
      const q = query(
        referralsRef,
        where('affiliateId', '==', selectedAffiliateId),
        where('conversionTimestamp', '>=', Timestamp.fromDate(startDate)),
        where('conversionTimestamp', '<=', Timestamp.fromDate(endDate)),
        where('converted', '==', true),
        where('isPaid', '==', false)
      );
      
      const querySnapshot = await getDocs(q);
      const referralIds = querySnapshot.docs.map(doc => doc.id);
      
      // Create payout
      await createAffiliatePayout(
        selectedAffiliateId,
        {
          amount: payoutData.amount,
          currency: payoutData.currency,
          method: payoutData.method,
          reference: payoutData.reference,
          notes: payoutData.notes,
          referralIds,
          dateRange: {
            start: startDate,
            end: endDate
          }
        },
        'current-admin-id' // TODO: Get from auth context
      );
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error creating payout:', error);
      alert('Failed to create payout. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Get selected affiliate
  const selectedAffiliate = affiliates.find(a => a.id === selectedAffiliateId);
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
        
        <div className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Create New Payout</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="px-4 py-5 sm:p-6">
              {loading ? (
                <div className="py-4 flex justify-center">
                  <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Affiliate Selection */}
                  <div>
                    <label htmlFor="affiliate" className="block text-sm font-medium text-gray-700">
                      Affiliate
                    </label>
                    <select
                      id="affiliate"
                      name="affiliate"
                      value={selectedAffiliateId}
                      onChange={handleAffiliateChange}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                      disabled={!!affiliateId || isSubmitting}
                    >
                      {affiliates.length === 0 ? (
                        <option value="">No affiliates available</option>
                      ) : (
                        affiliates.map((affiliate) => (
                          <option key={affiliate.id} value={affiliate.id}>
                            {affiliate.name} ({affiliate.code})
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  
                  {/* Date Range */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="start" className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="start"
                        id="start"
                        value={dateRange.start}
                        onChange={handleDateRangeChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="end" className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="end"
                        id="end"
                        value={dateRange.end}
                        onChange={handleDateRangeChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        min={dateRange.start}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  {/* Referral Summary */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Referral Summary</h4>
                    <div className="mt-2 p-4 bg-gray-50 rounded-md">
                      {loadingReferrals ? (
                        <div className="py-4 flex justify-center">
                          <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        </div>
                      ) : (
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-3">
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Total Referrals</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {referralSummary.totalReferrals.toLocaleString()}
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Converted Referrals</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {referralSummary.convertedReferrals.toLocaleString()}
                            </dd>
                          </div>
                          <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Unpaid Amount</dt>
                            <dd className="mt-1 text-sm text-gray-900 font-medium">
                              ${referralSummary.unpaidAmount.toFixed(2)}
                            </dd>
                          </div>
                        </dl>
                      )}
                    </div>
                  </div>
                  
                  {/* Payout Details */}
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-3">
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                        Payout Amount
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                          type="number"
                          name="amount"
                          id="amount"
                          min="0"
                          step="0.01"
                          value={payoutData.amount}
                          onChange={handleChange}
                          className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                          placeholder="0.00"
                          disabled={isSubmitting}
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">USD</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="sm:col-span-3">
                      <label htmlFor="method" className="block text-sm font-medium text-gray-700">
                        Payment Method
                      </label>
                      <select
                        id="method"
                        name="method"
                        value={payoutData.method}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        disabled={isSubmitting}
                      >
                        <option value="paypal">PayPal</option>
                        <option value="ach">Bank Transfer (ACH)</option>
                        <option value="check">Check</option>
                        <option value="other">Other</option>
                      </select>
                      {selectedAffiliate?.paymentMethod && (
                        <p className="mt-1 text-xs text-gray-500">
                          Preferred method: {selectedAffiliate.paymentMethod}
                        </p>
                      )}
                    </div>
                    
                    <div className="sm:col-span-6">
                      <label htmlFor="reference" className="block text-sm font-medium text-gray-700">
                        Reference / Transaction ID
                      </label>
                      <input
                        type="text"
                        name="reference"
                        id="reference"
                        value={payoutData.reference}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        disabled={isSubmitting}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Optional: Enter a reference number or transaction ID for this payout.
                      </p>
                    </div>
                    
                    <div className="sm:col-span-6">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        rows={3}
                        value={payoutData.notes}
                        onChange={handleChange}
                        className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={isSubmitting || payoutData.amount <= 0 || !selectedAffiliateId}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  'Create Payout'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePayoutModal;