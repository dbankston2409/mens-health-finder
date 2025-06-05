/**
 * Mock data for admin dashboard in development mode
 * Used to bypass Firebase permission issues
 */

// Mock admin data for development - no longer using mockClinics

export const mockAdminMetrics = {
  sales: {
    totalRevenue: 0,
    activeClinics: 0,
    conversion: 0,
    revenueByTier: {
      high: 0,
      low: 0,
      free: 0
    },
    subscriptionsByTier: {
      high: 0,
      low: 0,
      free: 0
    },
    revenueByMonth: []
  },
  
  traffic: {
    totalViews: 0,
    uniqueVisitors: 0,
    avgSessionDuration: 0,
    bounceRate: 0,
    topPages: [],
    trafficByDay: []
  },
  
  search: {
    impressions: 0,
    clicks: 0,
    ctr: 0,
    avgPosition: 0,
    topQueries: []
  },
  
  support: {
    openTickets: 0,
    avgResponseTime: 0,
    satisfaction: 0
  },
  
  website: {
    uptime: 0,
    avgLoadTime: 0,
    errors: 0,
    performance: 0,
    accessibility: 0,
    bestPractices: 0,
    seo: 0,
    issuesByCategory: {}
  },
  
  notifications: []
};

export const mockClinicQueueData = []; // Empty array - no longer using mock clinics

export const mockClinicDetails = (id: string) => {
  // Return null since we have no mock data
  return null;
};