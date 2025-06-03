import React, { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import Link from 'next/link';

interface ImportSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  status: 'preparing' | 'processing' | 'completed' | 'failed';
  totalClinics: number;
  processed: number;
  successful: number;
  failed: number;
  duplicates: number;
  currentClinic?: string;
  currentIndex?: number;
  errors: Array<{
    clinic: string;
    error: string;
    timestamp: Date;
  }>;
  successfulSlugs: string[];
}

interface ImportProgressTrackerProps {
  importId: string;
}

export default function ImportProgressTracker({ importId }: ImportProgressTrackerProps) {
  const [session, setSession] = useState<ImportSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!importId) return;

    const unsubscribe = onSnapshot(
      doc(db, 'import_sessions', importId),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setSession({
            id: snapshot.id,
            ...data,
            startTime: data.startTime?.toDate() || new Date(),
            endTime: data.endTime?.toDate(),
            errors: data.errors || [],
            successfulSlugs: data.successfulSlugs || []
          } as ImportSession);
        }
      },
      (err) => {
        console.error('Error watching import session:', err);
        setError('Failed to load import session');
      }
    );

    return () => unsubscribe();
  }, [importId]);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  const progress = session.totalClinics > 0 
    ? (session.processed / session.totalClinics) * 100 
    : 0;

  const duration = session.endTime 
    ? session.endTime.getTime() - session.startTime.getTime()
    : Date.now() - session.startTime.getTime();

  const estimatedTimeRemaining = session.processed > 0 && session.status === 'processing'
    ? ((duration / session.processed) * (session.totalClinics - session.processed)) / 1000
    : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Import Progress</h3>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            session.status === 'processing' ? 'bg-blue-100 text-blue-800' :
            session.status === 'completed' ? 'bg-green-100 text-green-800' :
            session.status === 'failed' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{session.processed} of {session.totalClinics} clinics</span>
            <span>{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {session.status === 'processing' && estimatedTimeRemaining > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Estimated time remaining: {Math.ceil(estimatedTimeRemaining / 60)} minutes
            </p>
          )}
        </div>

        {/* Current Processing */}
        {session.status === 'processing' && session.currentClinic && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Currently processing:</span> {session.currentClinic}
              {session.currentIndex && ` (${session.currentIndex} of ${session.totalClinics})`}
            </p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{session.successful}</p>
            <p className="text-sm text-gray-600">Successful</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-600">{session.failed}</p>
            <p className="text-sm text-gray-600">Failed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{session.duplicates}</p>
            <p className="text-sm text-gray-600">Duplicates</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-600">
              {Math.round(duration / 1000)}s
            </p>
            <p className="text-sm text-gray-600">Duration</p>
          </div>
        </div>
      </div>

      {/* Recent Errors */}
      {session.errors.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Errors</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {session.errors.slice(-10).reverse().map((error, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-sm font-medium text-red-800">{error.clinic}</p>
                <p className="text-sm text-red-600">{error.error}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recently Imported */}
      {session.successfulSlugs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recently Imported Clinics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {session.successfulSlugs.slice(-12).map((slug) => (
              <Link
                key={slug}
                href={`/admin/clinic/${slug}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline truncate"
              >
                {slug}
              </Link>
            ))}
          </div>
          {session.successful > 12 && (
            <p className="text-sm text-gray-500 mt-3">
              And {session.successful - 12} more...
            </p>
          )}
        </div>
      )}
    </div>
  );
}