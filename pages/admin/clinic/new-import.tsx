import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../../components/Layout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ImportClinicForm from '../../../components/admin/import/ImportClinicForm';
import DuplicateReviewModal from '../../../components/admin/import/DuplicateReviewModal';
import useClinicImport from '../../../utils/hooks/useClinicImport';

const NewImportPage: React.FC = () => {
  const router = useRouter();
  const { importProgress, startImport, processDuplicateDecisions, reset } = useClinicImport();

  // Handle import completion
  const handleImportComplete = async (file: File, options: any) => {
    try {
      await startImport(file, options);
    } catch (error) {
      console.error('Error starting import:', error);
    }
  };

  // Handle approving duplicate decisions
  const handleDuplicateDecisions = async (decisions: { clinicId: string; action: 'merge' | 'create' | 'skip' }[]) => {
    try {
      await processDuplicateDecisions(decisions);
    } catch (error) {
      console.error('Error processing duplicate decisions:', error);
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <Layout>
        <Head>
          <title>Import Clinics | Men&apos;s Health Finder Admin</title>
          <meta name="description" content="Import clinics with enhanced data validation" />
        </Head>
        
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-900">Import Clinics</h1>
              <button
                type="button"
                onClick={() => router.push('/admin/import-logs')}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Import Logs
              </button>
            </div>
            
            <div className="mt-6">
              {importProgress.status === 'checking_duplicates' && importProgress.duplicates.length > 0 ? (
                <DuplicateReviewModal 
                  duplicates={importProgress.duplicates}
                  onClose={() => router.push('/admin/import-logs')}
                  onApprove={handleDuplicateDecisions}
                  isSubmitting={importProgress.status === 'importing'}
                />
              ) : (
                <ImportClinicForm onImportComplete={handleImportComplete} />
              )}
              
              {importProgress.status === 'complete' && (
                <div className="mt-8 bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Import Summary</h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded">
                      <dt className="text-sm font-medium text-gray-500">Total Records</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-900">{importProgress.stats.total}</dd>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded">
                      <dt className="text-sm font-medium text-green-800">Created</dt>
                      <dd className="mt-1 text-3xl font-semibold text-green-900">{importProgress.stats.created}</dd>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded">
                      <dt className="text-sm font-medium text-blue-800">Merged</dt>
                      <dd className="mt-1 text-3xl font-semibold text-blue-900">{importProgress.stats.merged}</dd>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded">
                      <dt className="text-sm font-medium text-yellow-800">Duplicates</dt>
                      <dd className="mt-1 text-3xl font-semibold text-yellow-900">{importProgress.stats.duplicates}</dd>
                    </div>
                    
                    <div className="bg-gray-100 p-4 rounded">
                      <dt className="text-sm font-medium text-gray-600">Skipped</dt>
                      <dd className="mt-1 text-3xl font-semibold text-gray-800">{importProgress.stats.skipped}</dd>
                    </div>
                    
                    <div className={`${importResult.stats.failed > 0 ? 'bg-red-50' : 'bg-gray-50'} p-4 rounded`}>
                      <dt className={`text-sm font-medium ${importProgress.stats.failed > 0 ? 'text-red-800' : 'text-gray-500'}`}>
                        Failed
                      </dt>
                      <dd className={`mt-1 text-3xl font-semibold ${importProgress.stats.failed > 0 ? 'text-red-900' : 'text-gray-900'}`}>
                        {importProgress.stats.failed}
                      </dd>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => router.push('/admin/import-logs')}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      View Import Logs
                    </button>
                  </div>
                </div>
              )}
              
              {importProgress.status === 'error' && (
                <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
                  <h2 className="text-lg font-medium text-red-800 mb-2">Import Error</h2>
                  <p className="text-sm text-red-700">{importProgress.error || 'An unknown error occurred during import'}</p>
                  
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default NewImportPage;