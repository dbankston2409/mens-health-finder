import React from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import TrafficAndSEOReport from '../../../components/report/traffic-seo/TrafficAndSEOReport';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const ClinicReportPage: React.FC = () => {
  const router = useRouter();
  const { clinicId } = router.query;
  
  return (
    <AdminLayout title="Clinic Traffic & SEO Report">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-gray-300 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to clinic
        </button>
        
        <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md p-6">
          {clinicId ? (
            <TrafficAndSEOReport clinicId={clinicId as string} isPrintable={true} />
          ) : (
            <div className="py-12 text-center">
              <p className="text-gray-400">Loading report...</p>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-primary rounded-md hover:bg-primary-dark flex items-center"
          >
            <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Report
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ClinicReportPage;