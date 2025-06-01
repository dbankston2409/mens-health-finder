import React, { useState } from 'react';
import { 
  ArrowUpIcon,
  ArrowDownIcon,
  CreditCardIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { BillingData } from '../../../../utils/hooks/useBilling';
import { Clinic } from '../../../../utils/hooks/useClinic';
import { updateDoc, doc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';

interface BillingHistoryProps {
  billingData: BillingData;
  clinic: Clinic;
  loading: boolean;
  refreshData: () => void;
}

const PACKAGE_OPTIONS = [
  { id: 'free', name: 'Free', amount: 0 },
  { id: 'basic', name: 'Basic', amount: 49.99 },
  { id: 'premium', name: 'Premium', amount: 199.99 },
  { id: 'pro', name: 'Pro', amount: 349.99 }
];

const BillingHistory: React.FC<BillingHistoryProps> = ({
  billingData,
  clinic,
  loading,
  refreshData
}) => {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Success</span>;
      case 'failed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Failed</span>;
      case 'refunded':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Refunded</span>;
      case 'canceled':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Canceled</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">{status}</span>;
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPackage) return;
    
    setSubmitting(true);
    try {
      // Get package details
      const packageOption = PACKAGE_OPTIONS.find(p => p.id === selectedPackage);
      if (!packageOption) throw new Error('Invalid package selected');

      // Create a billing event
      const now = new Date();
      const renewalDate = new Date(now);
      renewalDate.setMonth(renewalDate.getMonth() + 1);

      // Add to billing collection
      await addDoc(collection(db, 'billing'), {
        clinicId: clinic.id || '',
        date: Timestamp.fromDate(now),
        amount: packageOption.amount,
        plan: packageOption.name,
        status: 'success',
        renewalDate: Timestamp.fromDate(renewalDate),
        paymentMethod: 'Manual (Admin)',
        notes: 'Plan changed by admin'
      });
      
      // Update clinic package tier
      if (clinic.id) {
        await updateDoc(doc(db, 'clinics', clinic.id), {
          packageTier: packageOption.name,
          status: 'active', // Ensure it's active when upgrading
          updatedAt: Timestamp.fromDate(now)
        });
      }
      
      // Log admin action
      await addDoc(collection(db, 'admin_logs'), {
        clinicId: clinic.id || '',
        timestamp: Timestamp.fromDate(now),
        actionType: 'plan_change',
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User', // Replace with actual admin name
        details: {
          oldPlan: billingData.currentPlan.name,
          newPlan: packageOption.name,
          amount: packageOption.amount
        }
      });
      
      setUpgradeModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Error upgrading plan:', error);
      alert('Failed to upgrade plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellationReason) return;
    
    setSubmitting(true);
    try {
      const now = new Date();
      
      // Add cancellation event to billing
      await addDoc(collection(db, 'billing'), {
        clinicId: clinic.id || '',
        date: Timestamp.fromDate(now),
        amount: 0,
        plan: billingData.currentPlan.name,
        status: 'canceled',
        cancellationReason,
        notes: 'Plan canceled by admin'
      });
      
      // Update clinic status
      if (clinic.id) {
        await updateDoc(doc(db, 'clinics', clinic.id), {
          status: 'canceled',
          updatedAt: Timestamp.fromDate(now)
        });
      }
      
      // Log admin action
      await addDoc(collection(db, 'admin_logs'), {
        clinicId: clinic.id || '',
        timestamp: Timestamp.fromDate(now),
        actionType: 'plan_cancel',
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User', // Replace with actual admin name
        details: {
          canceledPlan: billingData.currentPlan.name,
          reason: cancellationReason
        }
      });
      
      setCancelModalOpen(false);
      refreshData();
    } catch (error) {
      console.error('Error canceling plan:', error);
      alert('Failed to cancel plan. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReactivate = async () => {
    setSubmitting(true);
    try {
      const now = new Date();
      
      // Update clinic status
      if (clinic.id) {
        await updateDoc(doc(db, 'clinics', clinic.id), {
          status: 'active',
          updatedAt: Timestamp.fromDate(now)
        });
      }
      
      // Log admin action
      await addDoc(collection(db, 'admin_logs'), {
        clinicId: clinic.id || '',
        timestamp: Timestamp.fromDate(now),
        actionType: 'plan_reactivate',
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User', // Replace with actual admin name
        details: {
          plan: billingData.currentPlan.name
        }
      });
      
      refreshData();
    } catch (error) {
      console.error('Error reactivating plan:', error);
      alert('Failed to reactivate. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Current Subscription</h2>
        
        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-5 border border-blue-100 dark:border-blue-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <div className="flex items-center mb-2">
                <CreditCardIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {billingData.currentPlan.name || 'No Plan'} Plan
                </h3>
                {clinic.status === 'canceled' && (
                  <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Canceled
                  </span>
                )}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300">
                {formatCurrency(billingData.currentPlan.amount)} / month
              </p>
              
              {billingData.currentPlan.renewalDate && (
                <div className="mt-2 flex items-center text-sm text-gray-600 dark:text-gray-300">
                  <CalendarDaysIcon className="h-4 w-4 mr-1" />
                  Next billing date: {formatDate(billingData.currentPlan.renewalDate)}
                </div>
              )}
            </div>
            
            <div className="mt-4 md:mt-0 flex space-x-2">
              {clinic.status === 'canceled' ? (
                <button
                  onClick={handleReactivate}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reactivate Subscription
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setUpgradeModalOpen(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Change Plan
                  </button>
                  
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Billing History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Billing History</h2>
        
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        ) : billingData.events.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No billing history available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Plan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {billingData.events.map(event => (
                  <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {formatDate(event.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {event.plan}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                      {formatCurrency(event.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(event.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {event.cancellationReason ? (
                        <span className="text-red-600 dark:text-red-400">
                          Reason: {event.cancellationReason}
                        </span>
                      ) : (
                        event.notes || '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Upgrade Modal */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Change Subscription Plan
            </h3>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select a new plan for {clinic.name}. This change will be effective immediately.
              </p>
              
              <div className="space-y-2">
                {PACKAGE_OPTIONS.map(option => (
                  <div 
                    key={option.id}
                    className={`border rounded-lg p-4 cursor-pointer transition ${
                      selectedPackage === option.id 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400' 
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setSelectedPackage(option.id)}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">{option.name}</h4>
                        {option.id === 'free' && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">Limited visibility and features</p>
                        )}
                      </div>
                      <div className="text-gray-700 dark:text-gray-300">
                        {option.amount > 0 ? formatCurrency(option.amount) + '/mo' : 'Free'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setUpgradeModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleUpgrade}
                disabled={!selectedPackage || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center text-red-600 dark:text-red-400 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-medium">Cancel Subscription</h3>
            </div>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                You are about to cancel the subscription for {clinic.name}. This will immediately revoke premium features.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Cancellation
                </label>
                <select
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">Select a reason...</option>
                  <option value="Clinic closed">Clinic closed</option>
                  <option value="Price too high">Price too high</option>
                  <option value="Not enough leads">Not enough leads</option>
                  <option value="Switching to competitor">Switching to competitor</option>
                  <option value="Service issues">Service issues</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Never Mind
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancellationReason || submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingHistory;