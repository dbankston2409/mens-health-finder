import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, where } from 'firebase/firestore';
import { db } from '../../../apps/web/lib/firebase';

interface ImportStats {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  totalClinics: number;
  lastImport: Date | null;
}

const ImportStatsCard: React.FC = () => {
  const [stats, setStats] = useState<ImportStats>({
    totalImports: 0,
    successfulImports: 0,
    failedImports: 0,
    totalClinics: 0,
    lastImport: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Get total imports count
        const importsRef = collection(db, 'import_logs');
        const importsSnapshot = await getDocs(importsRef);
        const totalImports = importsSnapshot.size;
        
        // Get successful imports count
        const successfulImportsQuery = query(
          importsRef,
          where('status', '==', 'success')
        );
        const successfulImportsSnapshot = await getDocs(successfulImportsQuery);
        const successfulImports = successfulImportsSnapshot.size;
        
        // Get failed imports count
        const failedImportsQuery = query(
          importsRef,
          where('status', '==', 'failed')
        );
        const failedImportsSnapshot = await getDocs(failedImportsQuery);
        const failedImports = failedImportsSnapshot.size;
        
        // Get total clinics count
        const clinicsRef = collection(db, 'clinics');
        const clinicsSnapshot = await getDocs(clinicsRef);
        const totalClinics = clinicsSnapshot.size;
        
        // Get last import date
        const lastImportQuery = query(
          importsRef,
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const lastImportSnapshot = await getDocs(lastImportQuery);
        let lastImport = null;
        
        if (!lastImportSnapshot.empty) {
          const lastImportData = lastImportSnapshot.docs[0].data();
          lastImport = lastImportData.timestamp 
            ? new Date(lastImportData.timestamp.seconds * 1000) 
            : null;
        }
        
        setStats({
          totalImports,
          successfulImports,
          failedImports,
          totalClinics,
          lastImport
        });
      } catch (error) {
        console.error('Error fetching import stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium text-gray-900">Import Statistics</h3>
        <p className="mt-1 text-sm text-gray-500">
          Overview of clinic import operations
        </p>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        {loading ? (
          <div className="py-8 flex justify-center">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : (
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Imports</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {stats.totalImports.toLocaleString()}
              </dd>
            </div>
            
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Success Rate</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {stats.totalImports > 0 ? (
                  <div className="flex items-center">
                    <span className="font-medium mr-2">
                      {Math.round((stats.successfulImports / stats.totalImports) * 100)}%
                    </span>
                    <span className="text-sm text-gray-500">
                      ({stats.successfulImports} successful, {stats.failedImports} failed)
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">No imports yet</span>
                )}
              </dd>
            </div>
            
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Clinics</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {stats.totalClinics.toLocaleString()}
              </dd>
            </div>
            
            <div className="py-3 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Last Import</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {stats.lastImport ? (
                  stats.lastImport.toLocaleString()
                ) : (
                  <span className="text-gray-400">No imports yet</span>
                )}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
};

export default ImportStatsCard;