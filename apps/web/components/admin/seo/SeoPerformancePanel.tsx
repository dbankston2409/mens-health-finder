import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { db } from '../../../lib/firebase';
import { Clinic } from '../../../types';
import { batchGenerateSeoMeta } from '../../../utils/seo/metadataGenerator';
import { batchGenerateSeoContent } from '../../../utils/seo/contentGenerator';

// Import icons
import {
  ArrowUpIcon,
  ArrowDownIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

interface SeoPerformanceData {
  totalClinics: number;
  indexedClinics: number;
  notIndexedClinics: number;
  viewsLastMonth: number;
  clicksLastMonth: number;
  topSearchTerms: { term: string; count: number }[];
  clinicsWithZeroClicks: Clinic[];
  topPerformingClinics: { clinic: Clinic; impressions: number; clicks: number }[];
}

interface SeoPerformancePanelProps {
  className?: string;
  timeRange?: number; // days to look back for metrics
}

const SeoPerformancePanel: React.FC<SeoPerformancePanelProps> = ({ 
  className = '',
  timeRange = 30
}) => {
  const [data, setData] = useState<SeoPerformanceData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'clinics'>('overview');
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [selectedClinics, setSelectedClinics] = useState<string[]>([]);
  
  const fetchSeoPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range for metrics
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - timeRange);
      const startTimestamp = Timestamp.fromDate(startDate);
      
      // Fetch all clinics
      const clinicsRef = collection(db, 'clinics');
      const clinicsQuery = query(
        clinicsRef, 
        where('status', '==', 'active'),
        limit(500)
      );
      const clinicsSnapshot = await getDocs(clinicsQuery);
      
      const allClinics: Clinic[] = [];
      clinicsSnapshot.forEach((doc) => {
        const data = doc.data() as Clinic;
        data.id = doc.id;
        allClinics.push(data);
      });
      
      // Count indexed vs non-indexed
      const indexedClinics = allClinics.filter(clinic => clinic.seoMeta?.indexed).length;
      
      // Fetch traffic logs for views and clicks
      const trafficLogsRef = collection(db, 'traffic_logs');
      const trafficQuery = query(
        trafficLogsRef,
        where('timestamp', '>=', startTimestamp),
        orderBy('timestamp', 'desc')
      );
      const trafficSnapshot = await getDocs(trafficQuery);
      
      const trafficLogs: any[] = [];
      trafficSnapshot.forEach((doc) => {
        trafficLogs.push(doc.data());
      });
      
      // Calculate metrics
      const viewsLastMonth = trafficLogs.length;
      
      // Call logs for clicks
      const callLogsRef = collection(db, 'call_logs');
      const callQuery = query(
        callLogsRef,
        where('timestamp', '>=', startTimestamp),
        orderBy('timestamp', 'desc')
      );
      const callSnapshot = await getDocs(callQuery);
      
      const callLogs: any[] = [];
      callSnapshot.forEach((doc) => {
        callLogs.push(doc.data());
      });
      
      const clicksLastMonth = callLogs.length;
      
      // Aggregate search terms
      const searchTerms: Record<string, number> = {};
      trafficLogs.forEach(log => {
        if (log.searchQuery && log.searchQuery.trim() !== '') {
          const term = log.searchQuery.toLowerCase().trim();
          searchTerms[term] = (searchTerms[term] || 0) + 1;
        }
      });
      
      // Convert to sorted array
      const topSearchTerms = Object.entries(searchTerms)
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      
      // Find clinics with zero clicks in time period
      const clinicsWithClicks = new Set(callLogs.map(log => log.clinicId));
      const clinicsWithZeroClicks = allClinics.filter(clinic => 
        !clinicsWithClicks.has(clinic.id)
      ).slice(0, 10);
      
      // Calculate top performing clinics (most views and clicks)
      // This would normally use real GSC data, but we'll simulate with our traffic logs
      const clinicImpressions: Record<string, number> = {};
      const clinicClicks: Record<string, number> = {};
      
      // Count views (impressions) per clinic
      trafficLogs.forEach(log => {
        if (log.clinicId) {
          clinicImpressions[log.clinicId] = (clinicImpressions[log.clinicId] || 0) + 1;
        }
      });
      
      // Count clicks per clinic
      callLogs.forEach(log => {
        if (log.clinicId) {
          clinicClicks[log.clinicId] = (clinicClicks[log.clinicId] || 0) + 1;
        }
      });
      
      // Combine data for top performing clinics
      const clinicPerformance = allClinics.map(clinic => {
        const impressions = clinic.id ? clinicImpressions[clinic.id] || 0 : 0;
        const clicks = clinic.id ? clinicClicks[clinic.id] || 0 : 0;
        return { clinic, impressions, clicks };
      });
      
      // Sort by total engagement (impressions + clicks)
      const topPerformingClinics = clinicPerformance
        .sort((a, b) => (b.impressions + b.clicks) - (a.impressions + a.clicks))
        .slice(0, 10);
      
      // Set all data
      setData({
        totalClinics: allClinics.length,
        indexedClinics,
        notIndexedClinics: allClinics.length - indexedClinics,
        viewsLastMonth,
        clicksLastMonth,
        topSearchTerms,
        clinicsWithZeroClicks,
        topPerformingClinics
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching SEO performance data:', err);
      setError('Failed to load SEO performance data');
      setLoading(false);
    }
  };
  
  // Fetch data on mount and when timeRange changes
  useEffect(() => {
    fetchSeoPerformanceData();
  }, [timeRange]);
  
  // Handle bulk regeneration of SEO metadata and content
  const handleBulkRegenerate = async () => {
    if (selectedClinics.length === 0) return;
    
    try {
      setRegenerating(true);
      
      // Generate metadata for selected clinics
      await batchGenerateSeoMeta(selectedClinics);
      
      // Generate content for selected clinics
      await batchGenerateSeoContent(selectedClinics);
      
      // Refresh data
      await fetchSeoPerformanceData();
      
      // Clear selection
      setSelectedClinics([]);
      setRegenerating(false);
    } catch (err) {
      console.error('Error regenerating SEO content:', err);
      setRegenerating(false);
    }
  };
  
  // Toggle clinic selection for bulk operations
  const toggleClinicSelection = (clinicId: string) => {
    setSelectedClinics(prev => 
      prev.includes(clinicId)
        ? prev.filter(id => id !== clinicId)
        : [...prev, clinicId]
    );
  };
  
  // Export selected clinics as CSV
  const exportSelectedAsCsv = () => {
    if (!data) return;
    
    // Find selected clinics in all available data
    const selectedClinicData: Clinic[] = [];
    
    // Look in zero-click clinics
    data.clinicsWithZeroClicks.forEach(clinic => {
      if (selectedClinics.includes(clinic.id!)) {
        selectedClinicData.push(clinic);
      }
    });
    
    // Look in top performing clinics
    data.topPerformingClinics.forEach(({ clinic }) => {
      if (selectedClinics.includes(clinic.id!) && !selectedClinicData.some(c => c.id === clinic.id)) {
        selectedClinicData.push(clinic);
      }
    });
    
    // Create CSV content
    const headers = ['id', 'name', 'address', 'city', 'state', 'phone', 'package', 'indexed'];
    const rows = selectedClinicData.map(clinic => [
      clinic.id,
      clinic.name,
      clinic.address,
      clinic.city,
      clinic.state,
      clinic.phone,
      clinic.package,
      clinic.seoMeta?.indexed ? 'Yes' : 'No'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `selected-clinics-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  if (loading) {
    return (
      <div className={`bg-[#111111] rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-24 bg-gray-800 rounded"></div>
            <div className="h-24 bg-gray-800 rounded"></div>
            <div className="h-24 bg-gray-800 rounded"></div>
          </div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className={`bg-[#111111] rounded-lg shadow-md p-6 ${className}`}>
        <h2 className="text-xl font-bold mb-4">SEO Performance Dashboard</h2>
        <div className="bg-red-900 bg-opacity-20 border border-red-700 text-red-300 p-4 rounded">
          <p>{error || 'No data available'}</p>
          <button 
            onClick={fetchSeoPerformanceData} 
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
          <h2 className="text-xl font-bold mb-2 md:mb-0">SEO Performance Dashboard</h2>
          
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <select 
              className="bg-[#222222] text-sm border border-[#333333] rounded py-1 px-2 focus:outline-none focus:ring-1 focus:ring-primary"
              value={timeRange}
              onChange={(e) => {
                const range = parseInt(e.target.value);
                window.location.search = `?timeRange=${range}`;
              }}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            
            <button
              onClick={fetchSeoPerformanceData}
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
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Total Clinics</h3>
                <p className="text-2xl font-bold">{data.totalClinics}</p>
              </div>
              <div className="p-3 bg-[#222222] rounded-full">
                <DocumentDuplicateIcon className="h-5 w-5 text-blue-400" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <div className="flex-1">
                <div className="flex justify-between text-gray-400">
                  <span>Indexed</span>
                  <span>{data.indexedClinics}</span>
                </div>
                <div className="w-full bg-[#333333] h-1.5 rounded-full mt-1">
                  <div 
                    className="bg-green-500 h-1.5 rounded-full" 
                    style={{ width: `${(data.indexedClinics / data.totalClinics) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333333]">
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Profile Views</h3>
                <p className="text-2xl font-bold">{data.viewsLastMonth}</p>
              </div>
              <div className="p-3 bg-[#222222] rounded-full">
                <MagnifyingGlassIcon className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-400">
              <span>In the last {timeRange} days</span>
              {/* Would add trend data here if available */}
            </div>
          </div>
          
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#333333]">
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-400">Phone Clicks</h3>
                <p className="text-2xl font-bold">{data.clicksLastMonth}</p>
              </div>
              <div className="p-3 bg-[#222222] rounded-full">
                <ChartBarIcon className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="mt-2 flex items-center text-xs">
              <span className="text-gray-400">
                CTR: {data.viewsLastMonth > 0 
                  ? `${((data.clicksLastMonth / data.viewsLastMonth) * 100).toFixed(1)}%` 
                  : '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tab navigation */}
      <div className="p-2 bg-[#0a0a0a] border-b border-[#222222]">
        <div className="flex">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-sm rounded-md ${
              activeTab === 'overview' 
                ? 'bg-[#222222] text-white' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-4 py-2 text-sm rounded-md ${
              activeTab === 'search' 
                ? 'bg-[#222222] text-white' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Search Terms
          </button>
          <button
            onClick={() => setActiveTab('clinics')}
            className={`px-4 py-2 text-sm rounded-md ${
              activeTab === 'clinics' 
                ? 'bg-[#222222] text-white' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            Clinics
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">SEO Status Summary</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Indexing Progress</h4>
                  <div className="w-full bg-[#333333] h-4 rounded-full">
                    <div 
                      className="bg-gradient-to-r from-red-500 to-green-500 h-4 rounded-full"
                      style={{ width: `${(data.indexedClinics / data.totalClinics) * 100}%` }}
                    >
                    </div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className="text-gray-500">{data.notIndexedClinics} not indexed</span>
                    <span className="text-gray-500">{data.indexedClinics} indexed</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Performance Metrics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Click-Through Rate</span>
                      <span className="text-lg font-medium">
                        {data.viewsLastMonth > 0 
                          ? `${((data.clicksLastMonth / data.viewsLastMonth) * 100).toFixed(1)}%` 
                          : '0%'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Views per Clinic</span>
                      <span className="text-lg font-medium">
                        {data.totalClinics > 0 
                          ? (data.viewsLastMonth / data.totalClinics).toFixed(1) 
                          : '0'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg. Clicks per Clinic</span>
                      <span className="text-lg font-medium">
                        {data.totalClinics > 0 
                          ? (data.clicksLastMonth / data.totalClinics).toFixed(1) 
                          : '0'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Top Search Terms</h3>
                
                {data.topSearchTerms.length > 0 ? (
                  <div className="space-y-3">
                    {data.topSearchTerms.slice(0, 5).map((term, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-[#222222] flex items-center justify-center text-xs mr-2">
                            {index + 1}
                          </span>
                          <span className="truncate max-w-[200px]">{term.term}</span>
                        </span>
                        <span className="text-sm text-gray-400">{term.count} searches</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center p-4">No search data available</p>
                )}
                
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 w-full py-2 bg-[#222222] text-sm rounded hover:bg-[#333333] transition-colors"
                >
                  View All Search Terms
                </button>
              </div>
              
              <div className="bg-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-lg font-medium mb-4">Top Performing Clinics</h3>
                
                {data.topPerformingClinics.length > 0 ? (
                  <div className="space-y-3">
                    {data.topPerformingClinics.slice(0, 5).map(({ clinic, impressions, clicks }, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-[#222222] flex items-center justify-center text-xs mr-2">
                            {index + 1}
                          </span>
                          <span className="truncate max-w-[200px]">{clinic.name}</span>
                        </span>
                        <span className="text-sm text-gray-400">{impressions} views, {clicks} clicks</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center p-4">No clinic performance data available</p>
                )}
                
                <button
                  onClick={() => setActiveTab('clinics')}
                  className="mt-4 w-full py-2 bg-[#222222] text-sm rounded hover:bg-[#333333] transition-colors"
                >
                  View All Clinics
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Top Search Terms</h3>
              
              {data.topSearchTerms.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#333333]">
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Search Term
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Searches
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          % of Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333333]">
                      {data.topSearchTerms.map((term, index) => (
                        <tr key={index}>
                          <td className="py-3 px-4">
                            <span className="w-6 h-6 rounded-full bg-[#222222] flex items-center justify-center text-xs">
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {term.term}
                          </td>
                          <td className="py-3 px-4">
                            {term.count}
                          </td>
                          <td className="py-3 px-4">
                            {data.viewsLastMonth > 0 
                              ? `${((term.count / data.viewsLastMonth) * 100).toFixed(1)}%` 
                              : '0%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center p-4">No search data available</p>
              )}
            </div>
            
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Search Term Insights</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Search Categories</h4>
                  <div className="p-4 bg-[#111111] rounded-lg">
                    <ul className="space-y-2">
                      <li className="flex justify-between">
                        <span>Treatment Types</span>
                        <span className="text-gray-400">54%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Location Based</span>
                        <span className="text-gray-400">32%</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Clinic Names</span>
                        <span className="text-gray-400">14%</span>
                      </li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Recommended Keywords</h4>
                  <div className="p-4 bg-[#111111] rounded-lg">
                    <div className="flex flex-wrap gap-2">
                      {data.topSearchTerms.slice(0, 5).map((term, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-[#222222] text-xs rounded-full"
                        >
                          {term.term}
                        </span>
                      ))}
                      <span className="px-2 py-1 bg-[#222222] text-xs rounded-full">
                        men's health
                      </span>
                      <span className="px-2 py-1 bg-[#222222] text-xs rounded-full">
                        testosterone clinic
                      </span>
                      <span className="px-2 py-1 bg-[#222222] text-xs rounded-full">
                        TRT near me
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'clinics' && (
          <div className="space-y-6">
            {/* Bulk actions */}
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-lg font-medium">Clinic SEO Management</h3>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleBulkRegenerate}
                    disabled={selectedClinics.length === 0 || regenerating}
                    className={`px-3 py-1.5 text-sm rounded flex items-center ${
                      selectedClinics.length === 0 || regenerating
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-dark text-white'
                    }`}
                  >
                    {regenerating ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 mr-1.5 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <PencilSquareIcon className="h-4 w-4 mr-1.5" />
                        Regenerate SEO ({selectedClinics.length})
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={exportSelectedAsCsv}
                    disabled={selectedClinics.length === 0}
                    className={`px-3 py-1.5 text-sm rounded flex items-center ${
                      selectedClinics.length === 0
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-[#222222] hover:bg-[#333333] text-white'
                    }`}
                  >
                    <DocumentTextIcon className="h-4 w-4 mr-1.5" />
                    Export CSV
                  </button>
                </div>
              </div>
              
              {selectedClinics.length > 0 && (
                <div className="mt-4 py-2 px-3 bg-[#222222] rounded-md flex justify-between items-center">
                  <span className="text-sm">
                    {selectedClinics.length} clinic{selectedClinics.length !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => setSelectedClinics([])}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Clear Selection
                  </button>
                </div>
              )}
            </div>
            
            {/* Clinics with zero clicks */}
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Clinics with No Clicks (Last {timeRange} Days)</h3>
              
              {data.clinicsWithZeroClicks.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#333333]">
                        <th className="py-3 px-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-8">
                          <input 
                            type="checkbox" 
                            className="rounded border-[#333333] text-primary focus:ring-primary bg-[#222222]"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClinics(prev => [
                                  ...prev,
                                  ...data.clinicsWithZeroClicks
                                    .map(clinic => clinic.id!)
                                    .filter(id => !prev.includes(id))
                                ]);
                              } else {
                                setSelectedClinics(prev => 
                                  prev.filter(id => !data.clinicsWithZeroClicks.some(clinic => clinic.id === id))
                                );
                              }
                            }}
                            checked={data.clinicsWithZeroClicks.every(
                              clinic => selectedClinics.includes(clinic.id!)
                            )}
                          />
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
                          SEO Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333333]">
                      {data.clinicsWithZeroClicks.map((clinic, index) => (
                        <tr key={index} className="hover:bg-[#222222] group">
                          <td className="py-3 px-2">
                            <input 
                              type="checkbox" 
                              className="rounded border-[#333333] text-primary focus:ring-primary bg-[#222222]"
                              onChange={() => toggleClinicSelection(clinic.id!)}
                              checked={selectedClinics.includes(clinic.id!)}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{clinic.name}</div>
                            <div className="text-xs text-gray-500">{clinic.id!.substring(0, 8)}...</div>
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
                            {clinic.seoMeta?.indexed ? (
                              <span className="inline-flex items-center text-xs text-green-500">
                                <CheckCircleIcon className="h-4 w-4 mr-1" />
                                Indexed
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs text-red-500">
                                <XCircleIcon className="h-4 w-4 mr-1" />
                                Not Indexed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center p-4">No clinics with zero clicks found</p>
              )}
            </div>
            
            {/* Top performing clinics */}
            <div className="bg-[#1a1a1a] rounded-lg p-4">
              <h3 className="text-lg font-medium mb-4">Top Performing Clinics</h3>
              
              {data.topPerformingClinics.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-[#333333]">
                        <th className="py-3 px-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-8">
                          <input 
                            type="checkbox" 
                            className="rounded border-[#333333] text-primary focus:ring-primary bg-[#222222]"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedClinics(prev => [
                                  ...prev,
                                  ...data.topPerformingClinics
                                    .map(({ clinic }) => clinic.id!)
                                    .filter(id => !prev.includes(id))
                                ]);
                              } else {
                                setSelectedClinics(prev => 
                                  prev.filter(id => !data.topPerformingClinics.some(({ clinic }) => clinic.id === id))
                                );
                              }
                            }}
                            checked={data.topPerformingClinics.every(
                              ({ clinic }) => selectedClinics.includes(clinic.id!)
                            )}
                          />
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Clinic
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Location
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Views
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Clicks
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          CTR
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#333333]">
                      {data.topPerformingClinics.map(({ clinic, impressions, clicks }, index) => (
                        <tr key={index} className="hover:bg-[#222222]">
                          <td className="py-3 px-2">
                            <input 
                              type="checkbox" 
                              className="rounded border-[#333333] text-primary focus:ring-primary bg-[#222222]"
                              onChange={() => toggleClinicSelection(clinic.id!)}
                              checked={selectedClinics.includes(clinic.id!)}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium">{clinic.name}</div>
                            <div className="text-xs text-gray-500">{clinic.id!.substring(0, 8)}...</div>
                          </td>
                          <td className="py-3 px-4">
                            {clinic.city}, {clinic.state}
                          </td>
                          <td className="py-3 px-4">
                            {impressions}
                          </td>
                          <td className="py-3 px-4">
                            {clicks}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center">
                              <span className="font-medium mr-1">
                                {impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0'}%
                              </span>
                              {impressions > 0 && clicks > 0 && (
                                clicks / impressions > 0.1 ? (
                                  <ArrowUpIcon className="h-4 w-4 text-green-500" />
                                ) : (
                                  <ArrowDownIcon className="h-4 w-4 text-red-500" />
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center p-4">No clinic performance data available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeoPerformancePanel;