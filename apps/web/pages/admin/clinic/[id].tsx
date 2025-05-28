import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import ProtectedRoute from '../../../components/ProtectedRoute';
import useClinic from '../../../utils/hooks/useClinic';
import useBilling from '../../../utils/hooks/useBilling';
import useTraffic from '../../../utils/hooks/useTraffic';
import useLogs from '../../../utils/hooks/useLogs';
import useComms from '../../../utils/hooks/useComms';

// Import components
import ClinicHeader from './components/ClinicHeader';
import ClinicTabs from './components/ClinicTabs';
import ClinicInfoSection from './components/ClinicInfoSection';
import BillingHistory from './components/BillingHistory';
import TrafficEngagementMetrics from './components/TrafficEngagementMetrics';
import CommunicationLog from './components/CommunicationLog';
import AdminNotes from './components/AdminNotes';

const ClinicDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const clinicId = typeof id === 'string' ? id : '';
  
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  // Fetch clinic data
  const { clinic, loading: clinicLoading, error: clinicError } = useClinic(clinicId);
  const { billingData, loading: billingLoading } = useBilling(clinicId);
  const { trafficData, loading: trafficLoading } = useTraffic(clinicId);
  const { logs, loading: logsLoading } = useLogs(clinicId);
  const { comms, loading: commsLoading } = useComms(clinicId);
  
  // Forces all data hooks to refresh
  const refreshData = () => {
    setRefreshCounter(prev => prev + 1);
  };
  
  useEffect(() => {
    // Set the document title
    if (clinic) {
      document.title = `${clinic.name} - Admin | Men's Health Finder`;
    }
  }, [clinic]);
  
  const handleEditClinic = () => {
    // Navigate to edit page or open edit modal
    alert('Edit functionality would open here');
  };
  
  const handleMessageClinic = () => {
    // Open message modal
    setActiveTab('comms');
  };
  
  const renderTabContent = () => {
    if (clinicLoading || !clinic) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'overview':
        return <ClinicInfoSection clinic={clinic} />;
      case 'billing':
        return (
          <BillingHistory 
            billingData={billingData} 
            clinic={clinic} 
            loading={billingLoading}
            refreshData={refreshData}
          />
        );
      case 'traffic':
        return (
          <TrafficEngagementMetrics 
            trafficData={trafficData} 
            loading={trafficLoading} 
          />
        );
      case 'comms':
        return (
          <CommunicationLog 
            clinic={clinic} 
            comms={comms} 
            loading={commsLoading}
            refreshData={refreshData}
          />
        );
      case 'logs':
        return (
          <AdminNotes 
            logs={logs} 
            clinic={clinic} 
            loading={logsLoading}
            refreshData={refreshData}
          />
        );
      default:
        return <ClinicInfoSection clinic={clinic} />;
    }
  };
  
  // Handle errors
  if (clinicError) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">Error</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            There was an error loading the clinic details.
          </p>
          <Link href="/admin/crm">
            <span className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer">
              Return to Clinic Manager
            </span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/admin/dashboard">
                <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Dashboard</span>
              </Link>
              <span className="mx-2">/</span>
              <Link href="/admin/crm">
                <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer">Clinic Manager</span>
              </Link>
              <span className="mx-2">/</span>
              <span className="text-gray-700 dark:text-gray-300">
                {clinicLoading ? 'Loading...' : clinic?.name || 'Clinic Detail'}
              </span>
            </div>
            
            <Link href="/admin/crm">
              <span className="flex items-center text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Back to Clinic Manager
              </span>
            </Link>
          </div>
          
          {/* Clinic Header */}
          {clinic && (
            <ClinicHeader 
              clinic={clinic} 
              onEditClinic={handleEditClinic} 
              onMessageClinic={handleMessageClinic}
              refreshData={refreshData}
            />
          )}
          
          {/* Tabs */}
          <ClinicTabs 
            activeTab={activeTab} 
            onTabChange={setActiveTab}
          />
          
          {/* Tab Content */}
          {renderTabContent()}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ClinicDetailPage;