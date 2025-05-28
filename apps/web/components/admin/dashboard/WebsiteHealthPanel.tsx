import React from 'react';
import { useAdminMetrics } from '../../../utils/admin/useAdminMetrics';

const WebsiteHealthPanel: React.FC = () => {
  const { website, loading, error } = useAdminMetrics();

  // Helper to determine uptime status color
  const getUptimeStatusColor = (uptime: number) => {
    if (uptime >= 99.9) return 'bg-emerald-500';
    if (uptime >= 99.5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper to determine load speed status color
  const getLoadSpeedStatusColor = (loadTime: number) => {
    if (loadTime <= 1.0) return 'bg-emerald-500';
    if (loadTime <= 2.0) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Helper to determine error status color
  const getErrorStatusColor = (errors: number) => {
    if (errors === 0) return 'bg-emerald-500';
    if (errors <= 5) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
        <div className="text-center py-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-md font-medium mb-1">Error Loading Data</h3>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6 shadow-lg bg-[#111111] border border-[#222222] rounded-xl h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold">Website Health</h3>
        <a href="#" className="text-primary hover:text-red-400 text-sm font-medium flex items-center">
          View Detailed Report
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222] flex items-center">
          <div className="mr-4">
            <div className={`w-3 h-3 rounded-full ${getUptimeStatusColor(website.uptime)}`}></div>
          </div>
          <div>
            <h4 className="text-sm text-gray-400 mb-1">Uptime</h4>
            <p className="text-xl font-bold">{website.uptime}%</p>
          </div>
          <div className="ml-auto text-xs">
            <span className="inline-block px-2 py-1 bg-gray-800 rounded-md">
              Last 30 days
            </span>
          </div>
        </div>

        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222] flex items-center">
          <div className="mr-4">
            <div className={`w-3 h-3 rounded-full ${getLoadSpeedStatusColor(website.avgLoadTime)}`}></div>
          </div>
          <div>
            <h4 className="text-sm text-gray-400 mb-1">Avg. Load Time</h4>
            <p className="text-xl font-bold">{website.avgLoadTime}s</p>
          </div>
          <div className="ml-auto text-xs">
            <span className="inline-block px-2 py-1 bg-gray-800 rounded-md">
              Lighthouse
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222] flex items-center">
          <div className="mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm text-gray-400 mb-1">Indexed Pages</h4>
            <p className="text-xl font-bold">{website.indexedPages}</p>
          </div>
          <div className="ml-auto">
            <button className="text-primary hover:text-red-400 text-xs">
              View Index
            </button>
          </div>
        </div>

        <div className="bg-[#0A0A0A] p-4 rounded-lg border border-[#222222] flex items-center">
          <div className="mr-4">
            <div className={`w-3 h-3 rounded-full ${getErrorStatusColor(website.pageErrors)}`}></div>
          </div>
          <div>
            <h4 className="text-sm text-gray-400 mb-1">Page Errors</h4>
            <p className="text-xl font-bold">{website.pageErrors}</p>
          </div>
          <div className="ml-auto">
            <button className="text-primary hover:text-red-400 text-xs">
              View Errors
            </button>
          </div>
        </div>
      </div>

      {/* Additional Info Section */}
      <div className="mt-6 p-4 bg-[#0A0A0A] rounded-lg border border-[#222222]">
        <h4 className="text-sm font-medium mb-3">Recent Updates</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start">
            <div className="mr-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
            <p className="text-gray-300">SSL certificates renewed on <span className="text-white">Oct 12, 2023</span></p>
          </div>
          <div className="flex items-start">
            <div className="mr-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            </div>
            <p className="text-gray-300">Core Web Vitals improved by <span className="text-white">18%</span> since last month</p>
          </div>
          <div className="flex items-start">
            <div className="mr-2 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
            </div>
            <p className="text-gray-300"><span className="text-white">3 pages</span> need mobile optimization</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebsiteHealthPanel;