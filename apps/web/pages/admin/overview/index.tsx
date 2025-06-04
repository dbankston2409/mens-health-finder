import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowPathIcon } from '@heroicons/react/24/solid';
import ProtectedRoute from '../../../components/ProtectedRoute';
import useAdminMetrics from '../../../utils/hooks/useAdminMetrics';

// Import components
import SalesSnapshotCard from './components/SalesSnapshotCard';
import LostRevenueWidget from './components/LostRevenueWidget';
import WebsiteHealthCard from './components/WebsiteHealthCard';
import TrafficAnalyticsPanel from './components/TrafficAnalyticsPanel';
import SearchVisibilityPanel from './components/SearchVisibilityPanel';
import TopClinicsCard from './components/TopClinicsCard';
import NotificationsFeed from './components/NotificationsFeed';
import WorkerControl from '../../../components/admin/WorkerControl';

const AdminOverviewPanel: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const { data, status, refreshAllMetrics } = useAdminMetrics();
  
  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await refreshAllMetrics();
    } catch (error) {
      console.error("Error refreshing metrics:", error);
    } finally {
      // Ensure minimum visual feedback time for UX
      setTimeout(() => setRefreshing(false), 800);
    }
  };
  
  return (
    <ProtectedRoute adminOnly>
      <div className="min-h-screen bg-[#111111]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <div className="flex items-center text-sm text-gray-400 mt-1">
                <span>Overview</span>
                <span className="mx-2">•</span>
                <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefreshAll}
                disabled={refreshing}
                className={`flex items-center px-4 py-2 rounded-md ${
                  refreshing
                    ? 'bg-gray-800 text-gray-400 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary-dark'
                }`}
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh All'}
              </button>
              
              <div className="hidden md:flex space-x-2">
                <Link href="/admin/crm" className="px-4 py-2 bg-gray-800 border border-[#222222] rounded-md text-gray-200 hover:bg-gray-700">
                  CRM
                </Link>
                
                <Link href="/admin/clients" className="px-4 py-2 bg-gray-800 border border-[#222222] rounded-md text-gray-200 hover:bg-gray-700">
                  Client Management
                </Link>
                
                <Link href="/admin/settings" className="px-4 py-2 bg-gray-800 border border-[#222222] rounded-md text-gray-200 hover:bg-gray-700">
                  Settings
                </Link>
              </div>
            </div>
          </div>
          
          {/* Responsive Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sales Snapshot Card */}
            <div className="lg:col-span-2">
              <SalesSnapshotCard 
                data={data.sales} 
                loading={status.salesLoading} 
                onRefresh={refreshAllMetrics}
              />
            </div>
            
            {/* Website Health Card */}
            <div>
              <WebsiteHealthCard 
                onRefresh={handleRefreshAll} 
              />
            </div>
            
            {/* Worker Control */}
            <div className="lg:col-span-3">
              <WorkerControl />
            </div>
            
            {/* Lost Revenue Widget */}
            <div className="lg:col-span-2">
              <LostRevenueWidget 
                data={data.lostRevenue} 
                loading={status.lostRevenueLoading} 
                onRefresh={refreshAllMetrics}
              />
            </div>
            
            {/* Notifications Feed */}
            <div>
              <NotificationsFeed onRefresh={handleRefreshAll} />
            </div>
            
            {/* Traffic Analytics Panel */}
            <div className="lg:col-span-2">
              <TrafficAnalyticsPanel 
                data={data.traffic} 
                loading={status.trafficLoading} 
                onRefresh={refreshAllMetrics}
              />
            </div>
            
            {/* Top Clinics Card */}
            <div>
              <TopClinicsCard 
                data={data.topClinics} 
                loading={status.topClinicsLoading} 
                onRefresh={refreshAllMetrics}
              />
            </div>
            
            {/* Search Visibility Panel */}
            <div className="lg:col-span-3">
              <SearchVisibilityPanel 
                data={data.searchVisibility} 
                loading={status.searchVisibilityLoading} 
                onRefresh={refreshAllMetrics}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminOverviewPanel;