import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useClinicDetail } from '../../../utils/admin/useClinicData';
import AdminLayout from '../AdminLayout';
import ClinicInfoSection from './sections/ClinicInfoSection';
import BillingSection from './sections/BillingSection';
import CommunicationSection from './sections/CommunicationSection';
import AnalyticsSection from './sections/AnalyticsSection';
import SuggestionsSection from './sections/SuggestionsSection';
import TrafficAndSEOReport from '../../../components/report/traffic-seo/TrafficAndSEOReport';

const ClinicDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const [activeTab, setActiveTab] = useState('info');

  // Fetch clinic data using custom hook
  const { clinic, loading, error } = useClinicDetail(id as string);

  if (loading) {
    return (
      <AdminLayout title="Clinic Details">
        <div className="h-96 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !clinic) {
    return (
      <AdminLayout title="Clinic Details">
        <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-300 px-4 py-3 rounded-md">
          <p>{error || 'Failed to load clinic details'}</p>
        </div>
      </AdminLayout>
    );
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-900 text-green-300';
      case 'Trial':
        return 'bg-blue-900 text-blue-300';
      case 'Paused':
        return 'bg-yellow-900 text-yellow-300';
      case 'Canceled':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType) {
      case 'Premium':
        return 'bg-purple-900 text-purple-300';
      case 'Basic':
        return 'bg-blue-900 text-blue-300';
      case 'Free':
        return 'bg-gray-800 text-gray-300';
      default:
        return 'bg-gray-800 text-gray-300';
    }
  };

  return (
    <AdminLayout title={clinic.name}>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <h1 className="text-2xl font-bold">{clinic.name}</h1>
              <span className={`ml-3 px-2 py-1 text-xs rounded-full ${getStatusColor(clinic.status)}`}>
                {clinic.status}
              </span>
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPackageColor(clinic.package)}`}>
                {clinic.package}
              </span>
            </div>
            <p className="text-gray-400">{clinic.address}</p>
          </div>

          <div className="mt-4 sm:mt-0 flex gap-2">
            <button 
              onClick={() => router.push(`/admin/clients/${clinic.id}/edit`)}
              className="px-4 py-2 bg-gray-800 rounded-md hover:bg-gray-700"
            >
              Edit
            </button>
            <button className="px-4 py-2 bg-primary rounded-md hover:bg-primary-dark">
              Contact
            </button>
            <button 
              onClick={() => router.push(`/admin/reports/${clinic.id}/pdf`)}
              className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
            >
              <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Report
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#222222] mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('info')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            Clinic Info
          </button>
          <button
            onClick={() => handleTabChange('billing')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'billing'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            Billing
          </button>
          <button
            onClick={() => handleTabChange('communication')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'communication'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            Communication
          </button>
          <button
            onClick={() => handleTabChange('analytics')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => handleTabChange('traffic-seo')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'traffic-seo'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            Traffic & SEO
          </button>
          <button
            onClick={() => handleTabChange('suggestions')}
            className={`py-3 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'suggestions'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700'
            }`}
          >
            Suggestions
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {activeTab === 'info' && <ClinicInfoSection clinic={clinic} />}
        {activeTab === 'billing' && <BillingSection billing={clinic.billing} />}
        {activeTab === 'communication' && <CommunicationSection communication={clinic.communication} clinic={clinic} />}
        {activeTab === 'analytics' && <AnalyticsSection analytics={clinic.analytics} />}
        {activeTab === 'traffic-seo' && <TrafficAndSEOReport clinicId={id as string} />}
        {activeTab === 'suggestions' && <SuggestionsSection suggestions={clinic.suggestions} />}
      </div>
    </AdminLayout>
  );
};

export default ClinicDetailPage;