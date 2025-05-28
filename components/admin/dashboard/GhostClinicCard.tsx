import React, { useState, useEffect } from 'react';
import { getGhostClinicsSummary } from '../../../apps/worker/tasks/ghostClinicScanner';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { 
  ExclamationTriangleIcon, 
  PauseIcon, 
  FlagIcon, 
  CheckIcon,
  ClockIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

interface GhostClinic {
  id: string;
  name: string;
  lastActivity: Date | null;
  daysSinceActivity: number;
  package: string;
  status: string;
}

/**
 * Display ghost clinics in admin dashboard
 */
export function GhostClinicCard() {
  const [ghostClinics, setGhostClinics] = useState<GhostClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchGhostClinics();
  }, []);

  const fetchGhostClinics = async () => {
    try {
      setLoading(true);
      
      // Get summary stats
      const summaryData = await getGhostClinicsSummary();
      setSummary(summaryData);
      
      // Get detailed ghost clinic data
      const clinicsRef = collection(db, 'clinics');
      const ghostQuery = query(
        clinicsRef,
        where('tags', 'array-contains', 'ghost-clinic')
      );
      
      const ghostSnap = await getDocs(ghostQuery);
      const clinics: GhostClinic[] = ghostSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Clinic',
          lastActivity: data.engagement?.lastClick?.toDate() || 
                       data.engagement?.lastCall?.toDate() || 
                       null,
          daysSinceActivity: data.engagement?.daysSinceActivity || 0,
          package: data.package || 'free',
          status: data.status || 'active'
        };
      });
      
      // Sort by days since activity (most stale first)
      clinics.sort((a, b) => b.daysSinceActivity - a.daysSinceActivity);
      
      setGhostClinics(clinics);
      
    } catch (error) {
      console.error('Error fetching ghost clinics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClinicAction = async (clinicId: string, action: 'pause' | 'flag' | 'resolve') => {
    try {
      setProcessing(clinicId);
      
      const clinicRef = doc(db, 'clinics', clinicId);
      
      switch (action) {
        case 'pause':
          await updateDoc(clinicRef, {
            status: 'paused',
            statusChangedAt: new Date(),
            statusChangedBy: 'admin', // TODO: Get from auth context
            'engagement.pausedReason': 'Ghost clinic - no activity'
          });
          break;
          
        case 'flag':
          await updateDoc(clinicRef, {
            status: 'flagged',
            statusChangedAt: new Date(),
            statusChangedBy: 'admin',
            'engagement.flaggedReason': 'Ghost clinic - needs review'
          });
          break;
          
        case 'resolve':
          // Remove ghost tag and suggestions
          const currentTags = ghostClinics.find(c => c.id === clinicId);
          await updateDoc(clinicRef, {
            tags: [], // Remove all tags for now - in real implementation, filter out 'ghost-clinic'
            suggestions: [],
            'engagement.ghostResolved': true,
            'engagement.resolvedAt': new Date(),
            'engagement.resolvedBy': 'admin'
          });
          break;
      }
      
      console.log(`✅ ${action} action completed for clinic ${clinicId}`);
      
      // Refresh the list
      await fetchGhostClinics();
      
    } catch (error) {
      console.error(`Failed to ${action} clinic:`, error);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            👻 Ghost Clinics
            {summary && (
              <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {summary.totalGhostClinics}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Clinics with no activity in 90+ days
          </p>
        </div>
        
        <button
          onClick={fetchGhostClinics}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ArrowPathIcon className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-600">{summary.totalGhostClinics}</div>
            <div className="text-xs text-gray-600">Total Ghost Clinics</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-600">{summary.recentlyGhosted}</div>
            <div className="text-xs text-gray-600">Recently Ghosted (7d)</div>
          </div>
        </div>
      )}

      {/* Ghost Clinics List */}
      <div className="space-y-3">
        {ghostClinics.length === 0 ? (
          <div className="text-center py-8">
            <BuildingOffice2Icon className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No Ghost Clinics!</h3>
            <p className="text-sm text-gray-500">
              All clinics are showing healthy activity.
            </p>
          </div>
        ) : (
          ghostClinics.slice(0, 10).map((clinic) => (
            <GhostClinicRow
              key={clinic.id}
              clinic={clinic}
              onAction={handleClinicAction}
              processing={processing === clinic.id}
            />
          ))
        )}
      </div>
      
      {ghostClinics.length > 10 && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Showing 10 of {ghostClinics.length} ghost clinics
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual ghost clinic row
 */
interface GhostClinicRowProps {
  clinic: GhostClinic;
  onAction: (clinicId: string, action: 'pause' | 'flag' | 'resolve') => void;
  processing: boolean;
}

function GhostClinicRow({ clinic, onAction, processing }: GhostClinicRowProps) {
  const getPackageBadge = (pkg: string) => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
    
    switch (pkg) {
      case 'premium':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'basic':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'free':
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium';
    
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'paused':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'flagged':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h4 className="text-sm font-medium text-gray-900">
              {clinic.name}
            </h4>
            
            <span className={getPackageBadge(clinic.package)}>
              {clinic.package}
            </span>
            
            <span className={getStatusBadge(clinic.status)}>
              {clinic.status}
            </span>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <ClockIcon className="h-3 w-3" />
              <span>
                {clinic.daysSinceActivity} days inactive
              </span>
            </div>
            
            {clinic.lastActivity && (
              <div>
                Last activity: {clinic.lastActivity.toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onAction(clinic.id, 'pause')}
            disabled={processing || clinic.status === 'paused'}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50"
            title="Pause clinic"
          >
            <PauseIcon className="h-3 w-3 mr-1" />
            Pause
          </button>
          
          <button
            onClick={() => onAction(clinic.id, 'flag')}
            disabled={processing || clinic.status === 'flagged'}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
            title="Flag for review"
          >
            <FlagIcon className="h-3 w-3 mr-1" />
            Flag
          </button>
          
          <button
            onClick={() => onAction(clinic.id, 'resolve')}
            disabled={processing}
            className="inline-flex items-center px-2 py-1 text-xs font-medium rounded border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50"
            title="Mark as resolved"
          >
            <CheckIcon className="h-3 w-3 mr-1" />
            Resolve
          </button>
        </div>
      </div>
      
      {processing && (
        <div className="mt-2 flex items-center space-x-2 text-xs text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span>Processing...</span>
        </div>
      )}
    </div>
  );
}