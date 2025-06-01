import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import ImportLogsViewer from '../../components/admin/import/ImportLogsViewer';
import ImportStatsCard from '../../components/admin/import/ImportStatsCard';
import Layout from '../../components/Layout';
import ProtectedRoute from '../../components/ProtectedRoute';

const ImportLogsPage: React.FC = () => {
  const router = useRouter();
  
  return (
    <ProtectedRoute adminOnly>
      <Layout>
        <Head>
          <title>Import Logs | Men&apos;s Health Finder Admin</title>
          <meta name="description" content="View clinic import logs" />
        </Head>
        
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Import Logs</h1>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/admin/clinic/new-import')}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  New Import
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Back
                </button>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <ImportStatsCard />
              </div>
              
              <div className="lg:col-span-2">
                <div className="bg-white shadow rounded-lg p-4 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-2">About Import Logs</h2>
                  <p className="text-sm text-gray-600">
                    This page shows logs for all clinic import operations. You can view details about each import job, 
                    including the number of successful and failed records, and retry any failed imports.
                  </p>
                </div>
                
                <ImportLogsViewer pageSize={15} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default ImportLogsPage;