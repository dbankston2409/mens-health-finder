import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface AdminMetrics {
  revenue: {
    mrr: number;
    arr: number;
    totalToday: number;
    growth: number;
  };
  signups: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
    growth: number;
  };
  plans: {
    freeTier: number;
    basicTier: number;
    premiumTier: number;
  };
  website: {
    uptime: number;
    avgLoadTime: number;
    indexedPages: number;
    pageErrors: number;
  };
  analytics: {
    sessions: number;
    users: number;
    bounceRate: number;
    avgTimeOnSite: number;
    topSources: Array<{ source: string; count: number }>;
    topPages: Array<{ page: string; views: number }>;
  };
  search: {
    impressions: number;
    clicks: number;
    ctr: number;
    avgPosition: number;
    topQueries: Array<{ query: string; impressions: number; clicks: number }>;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'success' | 'error';
    message: string;
    date: string;
    read: boolean;
    actionRequired: boolean;
  }>;
  loading: boolean;
  error: string | null;
}

export const useAdminMetrics = (): AdminMetrics => {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    revenue: { mrr: 0, arr: 0, totalToday: 0, growth: 0 },
    signups: { last7Days: 0, last30Days: 0, last90Days: 0, growth: 0 },
    plans: { freeTier: 0, basicTier: 0, premiumTier: 0 },
    website: { uptime: 0, avgLoadTime: 0, indexedPages: 0, pageErrors: 0 },
    analytics: { 
      sessions: 0, users: 0, bounceRate: 0, avgTimeOnSite: 0,
      topSources: [], topPages: [] 
    },
    search: { 
      impressions: 0, clicks: 0, ctr: 0, avgPosition: 0,
      topQueries: [] 
    },
    alerts: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // In a real app, we would fetch this data from Firebase
        // For now, we'll use mock data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Set mock data
        setMetrics({
          revenue: {
            mrr: 48750,
            arr: 585000,
            totalToday: 1950,
            growth: 12.3
          },
          signups: {
            last7Days: 28,
            last30Days: 124,
            last90Days: 342,
            growth: 8.7
          },
          plans: {
            freeTier: 427,
            basicTier: 185, 
            premiumTier: 89
          },
          website: {
            uptime: 99.98,
            avgLoadTime: 0.82,
            indexedPages: 186,
            pageErrors: 3
          },
          analytics: {
            sessions: 12458,
            users: 8976,
            bounceRate: 42.3,
            avgTimeOnSite: 2.7,
            topSources: [
              { source: 'Google', count: 5421 },
              { source: 'Direct', count: 2104 },
              { source: 'Referral', count: 982 },
              { source: 'Social', count: 845 },
              { source: 'Email', count: 528 }
            ],
            topPages: [
              { page: 'Home', views: 4328 },
              { page: 'Search Results', views: 2813 },
              { page: 'Clinic Profile / Premium', views: 1694 },
              { page: 'TRT Page', views: 1447 },
              { page: 'About Us', views: 928 }
            ]
          },
          search: {
            impressions: 28450,
            clicks: 3476,
            ctr: 12.2,
            avgPosition: 18.4,
            topQueries: [
              { query: 'mens health clinic', impressions: 2840, clicks: 412 },
              { query: 'trt clinic near me', impressions: 2340, clicks: 385 },
              { query: 'low testosterone treatment', impressions: 1980, clicks: 302 },
              { query: 'ED clinic', impressions: 1760, clicks: 278 },
              { query: 'hormone replacement for men', impressions: 1540, clicks: 213 }
            ]
          },
          alerts: [
            {
              id: '1',
              type: 'warning',
              message: 'Premium Men\'s Health Clinic subscription expiring in 3 days',
              date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              read: false,
              actionRequired: true
            },
            {
              id: '2',
              type: 'info',
              message: 'New clinic "Advanced Men\'s Health" signed up for basic tier',
              date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
              read: true,
              actionRequired: false
            },
            {
              id: '3',
              type: 'error',
              message: 'Payment failed for "Texas Men\'s Clinic" - Card declined',
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              read: false,
              actionRequired: true
            },
            {
              id: '4',
              type: 'success',
              message: 'Elite Men\'s Clinic upgraded to premium tier',
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              read: true,
              actionRequired: false
            }
          ],
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching admin metrics:', error);
        setMetrics(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load admin metrics'
        }));
      }
    };

    fetchMetrics();
  }, []);

  return metrics;
};

// In a real implementation, you would fetch these from Firebase
// For now, let's use a mock function to get lost revenue data
export const fetchLostRevenueData = async () => {
  const mockData = [
    {
      id: '1',
      clinicId: 'clinic-001',
      clinicName: 'Premium Men\'s Health',
      amount: 2400,
      reason: 'Canceled',
      date: '2023-10-15',
      package: 'Premium',
      salesRep: 'John Smith',
      region: 'West'
    },
    {
      id: '2',
      clinicId: 'clinic-002',
      clinicName: 'Texas Men\'s Health Center',
      amount: 1200,
      reason: 'Failed Payment',
      date: '2023-10-10',
      package: 'Basic',
      salesRep: 'Emily Johnson',
      region: 'South'
    },
    {
      id: '3',
      clinicId: 'clinic-003',
      clinicName: 'Advanced Hormone Therapy',
      amount: 2400,
      reason: 'Downgrade',
      date: '2023-10-05',
      package: 'Premium',
      salesRep: 'John Smith',
      region: 'East'
    },
    {
      id: '4',
      clinicId: 'clinic-004',
      clinicName: 'Complete Men\'s Care',
      amount: 1200,
      reason: 'Canceled',
      date: '2023-09-28',
      package: 'Basic',
      salesRep: 'Michael Brown',
      region: 'Midwest'
    },
    {
      id: '5',
      clinicId: 'clinic-005',
      clinicName: 'Elite Testosterone Center',
      amount: 2400,
      reason: 'Missed Trial',
      date: '2023-09-22',
      package: 'Premium',
      salesRep: 'Sarah Wilson',
      region: 'West'
    },
    {
      id: '6',
      clinicId: 'clinic-006',
      clinicName: 'Men\'s Vitality Clinic',
      amount: 1200,
      reason: 'Failed Payment',
      date: '2023-09-18',
      package: 'Basic',
      salesRep: 'Emily Johnson',
      region: 'South'
    },
    {
      id: '7',
      clinicId: 'clinic-007',
      clinicName: 'Optimal Hormones LLC',
      amount: 2400,
      reason: 'Canceled',
      date: '2023-09-12',
      package: 'Premium',
      salesRep: 'John Smith',
      region: 'East'
    },
    {
      id: '8',
      clinicId: 'clinic-008',
      clinicName: 'Total Men\'s Wellness',
      amount: 1200,
      reason: 'Downgrade',
      date: '2023-09-05',
      package: 'Basic',
      salesRep: 'Michael Brown',
      region: 'Midwest'
    }
  ];
  
  return mockData;
};