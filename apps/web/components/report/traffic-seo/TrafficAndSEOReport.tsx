import React, { useState } from 'react';
import HeatmapPreview from './HeatmapPreview';
import SearchQueryTable from './SearchQueryTable';
import TopPagesChart from './TopPagesChart';
import ClinicKeywordCard from './ClinicKeywordCard';
import PerformanceSummaryCard from './PerformanceSummaryCard';
import CallMetricsOverlay from './CallMetricsOverlay';
import useClinicTrafficReport from '../../../utils/hooks/useClinicTrafficReport';
import { 
  ChartBarIcon, 
  MagnifyingGlassIcon, 
  ArrowPathIcon, 
  FireIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

interface TrafficAndSEOReportProps {
  clinicId: string;
  isPrintable?: boolean;
}

const TrafficAndSEOReport: React.FC<TrafficAndSEOReportProps> = ({ 
  clinicId,
  isPrintable = false
}) => {
  const { clinic, reportData, loading, error } = useClinicTrafficReport(clinicId);
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'analytics' | 'calls'>('overview');
  
  if (loading) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Loading traffic data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full py-8 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800 dark:text-red-300">Error Loading Report</h3>
          <p className="mt-2 text-red-700 dark:text-red-400">{error.message}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-800 dark:hover:bg-red-700 text-red-800 dark:text-red-200 rounded-md flex items-center"
            onClick={() => window.location.reload()}
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (!clinic || !reportData) {
    return (
      <div className="w-full py-8 px-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300">No Data Available</h3>
          <p className="mt-2 text-yellow-700 dark:text-yellow-400">
            No traffic data is available for this clinic. This could be because the clinic is new or hasn't received any traffic yet.
          </p>
        </div>
      </div>
    );
  }
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <PerformanceSummaryCard 
              data={reportData.performanceSummary}
              className="col-span-1"
            />
            <ClinicKeywordCard 
              data={reportData.keywordInsights}
              className="col-span-1"
            />
            <HeatmapPreview 
              data={reportData.heatmapData}
              clinicName={clinic.name}
              className="col-span-1 lg:col-span-2"
            />
          </div>
        );
        
      case 'search':
        return (
          <div className="mt-6 space-y-6">
            <SearchQueryTable 
              data={reportData.searchQueries}
            />
          </div>
        );
        
      case 'calls':
        return (
          <div className="mt-6 space-y-6">
            <CallMetricsOverlay 
              clinicId={clinicId}
              timeRange={30}
              className="w-full"
            />
          </div>
        );
        
      case 'analytics':
        return (
          <div className="grid grid-cols-1 gap-6 mt-6">
            <TopPagesChart 
              data={reportData.topPages}
            />
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1 bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-4">Traffic Over Time</h3>
                <div className="h-64">
                  {/* Traffic over time chart will be rendered here */}
                  {reportData.trafficOverTime.length > 0 ? (
                    <div className="h-full w-full flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">Traffic trend visualization</p>
                    </div>
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <p className="text-gray-500 dark:text-gray-400">No traffic data available</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-medium mb-4">Device Breakdown</h3>
                <div className="h-64">
                  {/* Device breakdown chart will be rendered here */}
                  <div className="h-full w-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400">Device usage visualization</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className={`w-full ${isPrintable ? 'p-8 max-w-5xl mx-auto' : ''}`}>
      {/* Header & Report Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">Traffic & SEO Performance</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Data for {clinic.name} in {clinic.city}, {clinic.state}
          </p>
        </div>
        
        {!isPrintable && (
          <div className="mt-4 md:mt-0 flex items-center space-x-2">
            <a
              href={`/admin/reports/${clinicId}/pdf`}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center text-sm"
            >
              <DocumentTextIcon className="h-4 w-4 mr-1.5" />
              Client Report
            </a>
            <button
              className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-md flex items-center text-sm"
              onClick={() => window.print()}
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
              Export Report
            </button>
            <button
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md flex items-center text-sm"
              onClick={() => window.location.reload()}
            >
              <ArrowPathIcon className="h-4 w-4 mr-1.5" />
              Refresh
            </button>
          </div>
        )}
      </div>
      
      {/* Tabs - not shown in printable view */}
      {!isPrintable && (
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              className={`py-4 px-1 flex items-center text-sm font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              <FireIcon className="h-5 w-5 mr-2" />
              Overview
            </button>
            <button
              className={`py-4 px-1 flex items-center text-sm font-medium ${
                activeTab === 'search'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('search')}
            >
              <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
              Search Queries
            </button>
            <button
              className={`py-4 px-1 flex items-center text-sm font-medium ${
                activeTab === 'calls'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('calls')}
            >
              <PhoneIcon className="h-5 w-5 mr-2" />
              Call Metrics
            </button>
            <button
              className={`py-4 px-1 flex items-center text-sm font-medium ${
                activeTab === 'analytics'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('analytics')}
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Analytics
            </button>
          </nav>
        </div>
      )}
      
      {/* Content */}
      {isPrintable ? (
        // Printable view shows all content without tabs
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceSummaryCard 
              data={reportData.performanceSummary}
              className="col-span-1"
            />
            <ClinicKeywordCard 
              data={reportData.keywordInsights}
              className="col-span-1"
            />
          </div>
          
          <HeatmapPreview 
            data={reportData.heatmapData}
            clinicName={clinic.name}
          />
          
          <div className="page-break-before">
            <h3 className="text-xl font-semibold mb-4">Search Queries</h3>
            <SearchQueryTable 
              data={reportData.searchQueries}
            />
          </div>
          
          <div className="page-break-before">
            <h3 className="text-xl font-semibold mb-4">Traffic Analytics</h3>
            <TopPagesChart 
              data={reportData.topPages}
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 page-break-before">
            <div className="flex-1 bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-4">Traffic Over Time</h3>
              <div className="h-64">
                {/* Traffic over time chart will be rendered here */}
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Traffic trend visualization</p>
                </div>
              </div>
            </div>
            <div className="flex-1 bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <h3 className="text-lg font-medium mb-4">Device Breakdown</h3>
              <div className="h-64">
                {/* Device breakdown chart will be rendered here */}
                <div className="h-full w-full flex items-center justify-center">
                  <p className="text-gray-500 dark:text-gray-400">Device usage visualization</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p>Report generated on {new Date().toLocaleDateString()} for Men's Health Finder</p>
            <p className="mt-1">Data based on traffic from {reportData.trafficOverTime[0]?.date} to {reportData.trafficOverTime[reportData.trafficOverTime.length - 1]?.date}</p>
          </div>
        </div>
      ) : (
        // Interactive view with tabs
        renderTabContent()
      )}
      
      {/* External Tools Links - not shown in printable view */}
      {!isPrintable && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">External Tools</h3>
          <div className="flex flex-wrap gap-2">
            <a 
              href={`https://search.google.com/search-console?resource_id=${encodeURIComponent(clinic.website || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md text-sm inline-flex items-center"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-1.5" />
              Google Search Console
            </a>
            <a 
              href={`https://pagespeed.web.dev/report?url=${encodeURIComponent(clinic.website || '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md text-sm inline-flex items-center"
            >
              <DocumentTextIcon className="h-4 w-4 mr-1.5" />
              Page Speed Insights
            </a>
            <a 
              href={`https://www.google.com/maps/search/${encodeURIComponent(clinic.name + ' ' + clinic.city)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md text-sm inline-flex items-center"
            >
              <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrafficAndSEOReport;