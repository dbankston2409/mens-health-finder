import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Clinic } from '../../../lib/api/clinicService';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Import icons
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MapPinIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';

interface IndexedClinicMapProps {
  className?: string;
}

// States for the filter dropdown
const states = [
  { code: 'all', name: 'All States' },
  { code: 'CA', name: 'California' },
  { code: 'TX', name: 'Texas' },
  { code: 'FL', name: 'Florida' },
  { code: 'NY', name: 'New York' },
  // Add other states as needed
];

// Package tiers for the filter dropdown
const packageOptions = [
  { value: 'all', label: 'All Packages' },
  { value: 'premium', label: 'Premium' },
  { value: 'basic', label: 'Basic' },
  { value: 'free', label: 'Free' }
];

const IndexedClinicMap: React.FC<IndexedClinicMapProps> = ({ className = '' }) => {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [indexedFilter, setIndexedFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'map' | 'table'>('table');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    indexed: 0,
    notIndexed: 0
  });
  
  const fetchClinics = async () => {
    try {
      setLoading(true);
      
      const clinicsRef = collection(db, 'clinics');
      let q = query(clinicsRef, where('status', '==', 'active'));
      
      // Apply state filter if not 'all'
      if (stateFilter !== 'all') {
        q = query(q, where('state', '==', stateFilter));
      }
      
      // Apply package filter if not 'all'
      if (packageFilter !== 'all') {
        q = query(q, where('package', '==', packageFilter));
      }
      
      // Sort by creation date
      q = query(q, orderBy('createdAt', 'desc'));
      
      // Limit to 500 for performance
      q = query(q, limit(500));
      
      const querySnapshot = await getDocs(q);
      
      const clinicData: Clinic[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Clinic;
        data.id = doc.id;
        clinicData.push(data);
      });
      
      setClinics(clinicData);
      
      // Calculate stats
      const indexedCount = clinicData.filter(clinic => clinic.seoMeta?.indexed).length;
      setStats({
        total: clinicData.length,
        indexed: indexedCount,
        notIndexed: clinicData.length - indexedCount
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching clinics:', err);
      setError('Failed to load clinic data');
      setLoading(false);
    }
  };
  
  // Fetch clinics on mount and when filters change
  useEffect(() => {
    fetchClinics();
  }, [stateFilter, packageFilter]);
  
  // Filter clinics based on indexed status
  const filteredClinics = clinics.filter(clinic => {
    if (indexedFilter === 'all') return true;
    if (indexedFilter === 'indexed') return clinic.seoMeta?.indexed === true;
    if (indexedFilter === 'not-indexed') return clinic.seoMeta?.indexed !== true;
    return true;
  });
  
  if (loading) {
    return (
      <div className={`bg-[#111111] rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3"></div>
          <div className="h-40 bg-gray-800 rounded"></div>
          <div className="h-8 bg-gray-800 rounded w-1/4"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-800 rounded"></div>
            <div className="h-6 bg-gray-800 rounded"></div>
            <div className="h-6 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-[#111111] rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-xl font-bold mb-4">Indexed Clinic Map</h2>
        <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-300 p-4 rounded">
          <p>{error}</p>
          <button 
            onClick={fetchClinics} 
            className="mt-2 px-3 py-1 bg-red-900 text-white rounded hover:bg-red-800 inline-flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`bg-[#111111] rounded-lg border border-[#222222] shadow-md ${className}`}>
      <div className="p-6 border-b border-[#222222]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-bold mb-2 md:mb-0">SEO Indexing Status</h2>
          
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${
                viewMode === 'table' 
                  ? 'bg-primary text-white' 
                  : 'bg-[#222222] text-gray-300 hover:bg-[#333333]'
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
              Table View
            </button>
            
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 text-sm rounded-md flex items-center ${
                viewMode === 'map' 
                  ? 'bg-primary text-white' 
                  : 'bg-[#222222] text-gray-300 hover:bg-[#333333]'
              }`}
            >
              <MapPinIcon className="h-4 w-4 mr-1" />
              Map View
            </button>
            
            <button
              onClick={fetchClinics}
              className="px-3 py-1 text-sm bg-[#222222] text-gray-300 rounded-md hover:bg-[#333333] flex items-center"
            >
              <ArrowPathIcon className="h-4 w-4 mr-1" />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Stats boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333333]">
            <h3 className="text-sm font-medium text-gray-400">Total Clinics</h3>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-green-900 border-opacity-30">
            <h3 className="text-sm font-medium text-gray-400">Indexed</h3>
            <p className="text-2xl font-bold text-green-500">{stats.indexed}</p>
            <p className="text-xs text-gray-500">
              {stats.total > 0 ? Math.round((stats.indexed / stats.total) * 100) : 0}% of total
            </p>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-red-900 border-opacity-30">
            <h3 className="text-sm font-medium text-gray-400">Not Indexed</h3>
            <p className="text-2xl font-bold text-red-500">{stats.notIndexed}</p>
            <p className="text-xs text-gray-500">
              {stats.total > 0 ? Math.round((stats.notIndexed / stats.total) * 100) : 0}% of total
            </p>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="p-4 bg-[#0a0a0a] border-b border-[#222222]">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center">
            <FunnelIcon className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-400">Filters:</span>
          </div>
          
          <div className="flex-1 flex flex-wrap gap-3">
            {/* State filter */}
            <select 
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="bg-[#222222] text-sm border border-[#333333] rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {states.map(state => (
                <option key={state.code} value={state.code}>{state.name}</option>
              ))}
            </select>
            
            {/* Package filter */}
            <select 
              value={packageFilter}
              onChange={(e) => setPackageFilter(e.target.value)}
              className="bg-[#222222] text-sm border border-[#333333] rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {packageOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            {/* Indexed status filter */}
            <select 
              value={indexedFilter}
              onChange={(e) => setIndexedFilter(e.target.value)}
              className="bg-[#222222] text-sm border border-[#333333] rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Statuses</option>
              <option value="indexed">Indexed Only</option>
              <option value="not-indexed">Not Indexed Only</option>
            </select>
          </div>
          
          <div className="ml-auto text-xs text-gray-500">
            Showing {filteredClinics.length} of {clinics.length} clinics
          </div>
        </div>
      </div>
      
      {/* Table View */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-[#191919]">
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Clinic
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Package
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Last Indexed
                </th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222222]">
              {filteredClinics.map((clinic) => (
                <tr key={clinic.id} className="hover:bg-[#151515] transition-colors">
                  <td className="py-3 px-4">
                    {clinic.seoMeta?.indexed ? (
                      <span className="inline-flex items-center">
                        <CheckCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                        <span className="text-green-500 text-xs">Indexed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        <XCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                        <span className="text-red-500 text-xs">Not Indexed</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{clinic.name}</div>
                    <div className="text-xs text-gray-500">{clinic.id?.substring(0, 8)}...</div>
                  </td>
                  <td className="py-3 px-4">
                    {clinic.city}, {clinic.state}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      clinic.package === 'premium' ? 'bg-blue-900 bg-opacity-30 text-blue-400' :
                      clinic.package === 'basic' ? 'bg-green-900 bg-opacity-30 text-green-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {clinic.package}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {clinic.seoMeta?.lastIndexed ? (
                      <span className="text-xs text-gray-400">
                        {(() => {
                          const date = clinic.seoMeta.lastIndexed;
                          if (date instanceof Date) {
                            return date.toLocaleDateString();
                          } else if (date && typeof date === 'object' && 'seconds' in date) {
                            return new Date((date as any).seconds * 1000).toLocaleDateString();
                          } else {
                            return new Date(date as any).toLocaleDateString();
                          }
                        })()}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">Never</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/clinic/${clinic.id}`}
                      className="inline-flex items-center px-2 py-1 bg-[#222222] text-xs rounded hover:bg-[#333333] transition-colors"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredClinics.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-500">No clinics match the selected filters</p>
            </div>
          )}
        </div>
      )}
      
      {/* Map View - Placeholder as dynamic implementation would require a map library */}
      {viewMode === 'map' && (
        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-gray-500 text-center">
            <p className="mb-2">Map view implementation requires integration with a mapping library</p>
            <p className="text-xs">Suggested: Google Maps, Mapbox, or Leaflet for interactive mapping</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IndexedClinicMap;