import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import ProtectedRoute from '../../../components/ProtectedRoute';
import AdminLayout from '../../../components/admin/AdminLayout';
import ImportProgressTracker from '../../../components/admin/import/ImportProgressTracker';

export default function ImportStatusPage() {
  const router = useRouter();
  const { importId } = router.query;

  return (
    <ProtectedRoute adminOnly>
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link 
              href="/admin/import-logs"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to Import Logs
            </Link>
            
            <h1 className="text-2xl font-bold text-gray-900">
              Import Session Status
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time progress tracking for clinic import
            </p>
          </div>

          {/* Progress Tracker */}
          {importId && typeof importId === 'string' ? (
            <ImportProgressTracker importId={importId} />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">Invalid import session ID</p>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}