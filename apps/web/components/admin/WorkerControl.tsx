import React, { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface WorkerConfig {
  isPaused: boolean;
  lastUpdated: Date;
  schedules?: Record<string, number>;
}

export default function WorkerControl() {
  const [workerConfig, setWorkerConfig] = useState<WorkerConfig | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Subscribe to worker config
    const unsubscribe = onSnapshot(
      doc(db, 'config', 'worker'),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setWorkerConfig({
            isPaused: data.isPaused !== false,
            lastUpdated: data.lastUpdated?.toDate() || new Date(),
            schedules: data.schedules
          });
        } else {
          // No config exists yet
          setWorkerConfig({
            isPaused: true,
            lastUpdated: new Date()
          });
        }
        setError(null);
      },
      (err) => {
        console.error('Error watching worker config:', err);
        setError('Failed to load worker status');
      }
    );

    return () => unsubscribe();
  }, []);

  const toggleWorkerState = async () => {
    if (!workerConfig) return;
    
    setIsUpdating(true);
    setError(null);
    
    try {
      await updateDoc(doc(db, 'config', 'worker'), {
        isPaused: !workerConfig.isPaused,
        lastUpdated: new Date()
      });
    } catch (err) {
      console.error('Failed to update worker state:', err);
      setError('Failed to update worker state');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!workerConfig) {
    return (
      <div className="bg-[#111111] border border-[#222222] rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const isPaused = workerConfig.isPaused;

  return (
    <div className="bg-[#111111] border border-[#222222] rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            Background Worker Status
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Controls automated jobs for analytics, reports, and maintenance
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className={`flex items-center ${isPaused ? 'text-yellow-500' : 'text-green-500'}`}>
            {isPaused ? (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Paused</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Active</span>
              </>
            )}
          </div>
          
          <button
            onClick={toggleWorkerState}
            disabled={isUpdating}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
              isUpdating 
                ? 'bg-gray-700 cursor-not-allowed' 
                : isPaused
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
            }`}
          >
            {isUpdating ? 'Updating...' : isPaused ? 'Start Worker' : 'Pause Worker'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/20 border border-red-900/50 rounded-md">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {workerConfig.schedules && (
        <div className="mt-6 pt-6 border-t border-[#222222]">
          <h4 className="text-sm font-medium text-white mb-3">Job Schedules</h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(workerConfig.schedules).map(([job, interval]) => (
              <div key={job} className="text-sm">
                <span className="font-medium text-gray-300 capitalize">
                  {job.replace(/([A-Z])/g, ' $1').trim()}:
                </span>
                <span className="text-gray-500 ml-1">
                  Every {interval / 1000 / 60} minutes
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Last updated: {workerConfig.lastUpdated.toLocaleString()}
      </div>
    </div>
  );
}