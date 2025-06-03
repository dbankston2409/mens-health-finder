import React from 'react';
import { useRouter } from 'next/router';
import AdminLayout from '../../../components/admin/AdminLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import ImportClinicForm from '../../../components/admin/import/ImportClinicForm';
import { useClinicImport } from '../../../utils/hooks/useClinicImport';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

const NewImportPage: React.FC = () => {
  const router = useRouter();
  const { startImport } = useClinicImport();

  const handleImportComplete = async (file: File, options: any) => {
    try {
      // Start the import process
      const result = await startImport(file, options);
      
      if (result.success && result.importId) {
        // Redirect to the import progress page
        router.push(`/admin/imports/${result.importId}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      // Error is handled by the form component
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <AdminLayout title="Import Clinics">
        <div className="max-w-4xl mx-auto">
          {/* Back button */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back
            </button>
          </div>

          {/* Import form */}
          <ImportClinicForm onImportComplete={handleImportComplete} />

          {/* Help section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">Import Guide</h3>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                <strong>File Format:</strong> Upload a CSV or JSON file containing clinic data.
              </p>
              <p>
                <strong>Required Fields:</strong> name, address, city, state, phone
              </p>
              <p>
                <strong>Optional Fields:</strong> zip, website, services (comma-separated), package, status
              </p>
              <p className="mt-4">
                The import process will:
              </p>
              <ul className="list-disc list-inside ml-4 mt-2">
                <li>Validate and normalize all clinic data</li>
                <li>Geocode addresses for map display</li>
                <li>Check for duplicate clinics</li>
                <li>Generate SEO metadata</li>
                <li>Tag clinics for manual review if issues are found</li>
              </ul>
              <p className="mt-4">
                After import, visit the <a href="/admin/validation-queue" className="text-blue-600 hover:text-blue-700 underline">Validation Queue</a> to review and approve imported clinics.
              </p>
            </div>
          </div>

          {/* Sample file download */}
          <div className="mt-6 text-center">
            <a
              href="/sample-clinics.csv"
              download
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Download sample CSV template
            </a>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default NewImportPage;