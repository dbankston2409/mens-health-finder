import { useState, useEffect, useCallback } from 'react';
import { db } from '../../lib/firebase'; // Use the client SDK
import { 
  SalesMetrics, 
  LostRevenueMetrics, 
  TrafficMetrics, 
  SearchVisibilityMetrics, 
  MetricOptions 
} from '../metrics/types';

// Import client-side fallbacks for server-side functions
import {
  getSalesMetrics,
  getLostRevenue,
  getTrafficMetrics,
  getSearchVisibilityMetrics,
  getAllClinicsEngagement,
  getClinicEngagement
} from '../dev/clientSideFallbacks';

export type AdminMetricsData = {
  sales: SalesMetrics | null;
  lostRevenue: LostRevenueMetrics | null;
  traffic: TrafficMetrics | null;
  searchVisibility: SearchVisibilityMetrics | null;
  topClinics: Array<{
    clinicId: string;
    clinicName: string;
    totalViews: number;
    viewsThisMonth: number;
    lastViewed: Date | null;
  }> | null;
};

export type AdminMetricsStatus = {
  salesLoading: boolean;
  lostRevenueLoading: boolean;
  trafficLoading: boolean;
  searchVisibilityLoading: boolean;
  topClinicsLoading: boolean;
  salesError: Error | null;
  lostRevenueError: Error | null;
  trafficError: Error | null;
  searchVisibilityError: Error | null;
  topClinicsError: Error | null;
};

export const useAdminMetrics = (options: MetricOptions = {}) => {
  const [data, setData] = useState<AdminMetricsData>({
    sales: null,
    lostRevenue: null,
    traffic: null,
    searchVisibility: null,
    topClinics: null
  });
  
  const [status, setStatus] = useState<AdminMetricsStatus>({
    salesLoading: true,
    lostRevenueLoading: true,
    trafficLoading: true,
    searchVisibilityLoading: true,
    topClinicsLoading: true,
    salesError: null,
    lostRevenueError: null,
    trafficError: null,
    searchVisibilityError: null,
    topClinicsError: null
  });

  const fetchSalesMetrics = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, salesLoading: true, salesError: null }));
      
      // Our client-side fallback will handle this for us
      const salesData = await getSalesMetrics();
      setData(prev => ({ ...prev, sales: salesData }));
    } catch (error) {
      console.error('Error fetching sales metrics:', error);
      setStatus(prev => ({ ...prev, salesError: error as Error }));
    } finally {
      setStatus(prev => ({ ...prev, salesLoading: false }));
    }
  }, [/* no dependencies */]);

  const fetchLostRevenue = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, lostRevenueLoading: true, lostRevenueError: null }));
      
      // Our client-side fallback will handle this for us
      const lostRevenueData = await getLostRevenue();
      setData(prev => ({ ...prev, lostRevenue: lostRevenueData }));
    } catch (error) {
      console.error('Error fetching lost revenue:', error);
      setStatus(prev => ({ ...prev, lostRevenueError: error as Error }));
    } finally {
      setStatus(prev => ({ ...prev, lostRevenueLoading: false }));
    }
  }, [/* no dependencies */]);

  const fetchTrafficMetrics = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, trafficLoading: true, trafficError: null }));
      
      // Our client-side fallback will handle this for us
      const trafficData = await getTrafficMetrics();
      setData(prev => ({ ...prev, traffic: trafficData }));
    } catch (error) {
      console.error('Error fetching traffic metrics:', error);
      setStatus(prev => ({ ...prev, trafficError: error as Error }));
    } finally {
      setStatus(prev => ({ ...prev, trafficLoading: false }));
    }
  }, [/* no dependencies */]);

  const fetchSearchVisibility = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, searchVisibilityLoading: true, searchVisibilityError: null }));
      
      // Our client-side fallback will handle this for us
      const searchData = await getSearchVisibilityMetrics();
      setData(prev => ({ ...prev, searchVisibility: searchData }));
    } catch (error) {
      console.error('Error fetching search visibility:', error);
      setStatus(prev => ({ ...prev, searchVisibilityError: error as Error }));
    } finally {
      setStatus(prev => ({ ...prev, searchVisibilityLoading: false }));
    }
  }, [/* no dependencies */]);

  const fetchTopClinics = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, topClinicsLoading: true, topClinicsError: null }));
      
      // Our client-side fallback will handle this for us
      const topClinicsData = await getAllClinicsEngagement();
      setData(prev => ({ ...prev, topClinics: topClinicsData }));
    } catch (error) {
      console.error('Error fetching top clinics:', error);
      setStatus(prev => ({ ...prev, topClinicsError: error as Error }));
    } finally {
      setStatus(prev => ({ ...prev, topClinicsLoading: false }));
    }
  }, [/* no dependencies */]);

  // Function to refresh all metrics - optimized for parallel execution
  const refreshAllMetrics = useCallback(async () => {
    // Start all fetch operations in parallel
    return Promise.all([
      fetchSalesMetrics(),
      fetchLostRevenue(),
      fetchTrafficMetrics(),
      fetchSearchVisibility(),
      fetchTopClinics()
    ]);
  }, [fetchSalesMetrics, fetchLostRevenue, fetchTrafficMetrics, fetchSearchVisibility, fetchTopClinics]);

  // Initial fetch - only run once on mount
  useEffect(() => {
    // Only fetch once at component mount
    const fetchInitialData = async () => {
      try {
        const [sales, lostRevenue, traffic, searchVisibility, topClinics] = await Promise.all([
          getSalesMetrics(),
          getLostRevenue(),
          getTrafficMetrics(),
          getSearchVisibilityMetrics(),
          getAllClinicsEngagement()
        ]);

        setData({
          sales,
          lostRevenue,
          traffic,
          searchVisibility,
          topClinics
        });
      } catch (error) {
        console.error('Error fetching initial metrics:', error);
      } finally {
        setStatus({
          salesLoading: false,
          lostRevenueLoading: false,
          trafficLoading: false,
          searchVisibilityLoading: false,
          topClinicsLoading: false,
          salesError: null,
          lostRevenueError: null,
          trafficError: null,
          searchVisibilityError: null,
          topClinicsError: null
        });
      }
    };

    fetchInitialData();
  }, [/* only run once on mount */]);

  return {
    data,
    status,
    refreshAllMetrics,
    refreshSalesMetrics: fetchSalesMetrics,
    refreshLostRevenue: fetchLostRevenue,
    refreshTrafficMetrics: fetchTrafficMetrics,
    refreshSearchVisibility: fetchSearchVisibility,
    refreshTopClinics: fetchTopClinics
  };
};

export default useAdminMetrics;