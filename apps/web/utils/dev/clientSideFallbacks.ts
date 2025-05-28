/**
 * Client-side fallbacks for server-side Firebase functions
 * Used to prevent errors when server-side code is imported into client-side bundle
 */

// Import mock data
import { mockAdminMetrics, mockClinicQueueData, mockClinicDetails, mockSeoPerformance } from './mockAdminData';
import { SalesMetrics, LostRevenueMetrics, TrafficMetrics, SearchVisibilityMetrics } from '../metrics/types';

// Re-export mock functions with the same signatures as the server-side functions
export const getSalesMetrics = async (): Promise<SalesMetrics> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock data in the expected format
  return {
    totalRevenueThisMonth: mockAdminMetrics.sales.totalRevenue,
    totalRevenueThisYear: mockAdminMetrics.sales.totalRevenue * 12,
    newSignupsThisMonth: mockAdminMetrics.sales.activeClinics / 4,
    activeSubscriptions: mockAdminMetrics.sales.activeClinics,
    churnedSubscriptions: Math.floor(mockAdminMetrics.sales.activeClinics * 0.03),
    averageRevenuePerClinic: mockAdminMetrics.sales.totalRevenue / mockAdminMetrics.sales.activeClinics,
    subscriptionsByPlan: {
      'Basic': mockAdminMetrics.sales.subscriptionsByTier.low,
      'Premium': mockAdminMetrics.sales.subscriptionsByTier.high,
      'Free': mockAdminMetrics.sales.subscriptionsByTier.free
    }
  };
};

export const getLostRevenue = async (): Promise<LostRevenueMetrics> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Convert mock data to expected format
  const reasonKeys = Object.keys(mockAdminMetrics.lostRevenue.reasonBreakdown);
  return {
    lostThisMonth: mockAdminMetrics.lostRevenue.totalEstimate / 12,
    lostThisYear: mockAdminMetrics.lostRevenue.totalEstimate,
    breakdownByReason: {
      canceled: (mockAdminMetrics.lostRevenue.reasonBreakdown as any)[reasonKeys[0]] || 0,
      downgrade: (mockAdminMetrics.lostRevenue.reasonBreakdown as any)[reasonKeys[1]] || 0,
      failedPayment: (mockAdminMetrics.lostRevenue.reasonBreakdown as any)[reasonKeys[2]] || 0,
      missedUpsell: (mockAdminMetrics.lostRevenue.reasonBreakdown as any)[reasonKeys[3]] || 0,
      expiredTrial: (mockAdminMetrics.lostRevenue.reasonBreakdown as any)[reasonKeys[4]] || 0
    },
    rawEvents: mockAdminMetrics.lostRevenue.clinicBreakdown.map(clinic => ({
      clinicId: String(clinic.id),
      clinicName: clinic.name,
      amount: clinic.estimate,
      reason: clinic.reason.includes('profile') ? 'canceled' : 
             clinic.reason.includes('contact') ? 'missedUpsell' : 
             clinic.reason.includes('review') ? 'downgrade' : 'failedPayment',
      date: { 
        seconds: Date.now()/1000 - (Math.random() * 86400 * 7), 
        toDate: function() { return new Date(this.seconds * 1000); }
      } as any
    }))
  };
};

export const getTrafficMetrics = async (): Promise<TrafficMetrics> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 700));
  
  return {
    totalClicksThisMonth: mockAdminMetrics.traffic.totalPageviews,
    topPages: mockAdminMetrics.traffic.topReferrers.map(ref => ({
      slug: `/clinic/${ref.source.toLowerCase().replace(' ', '-')}-mens-health`,
      clickCount: ref.visits
    })),
    topSearchQueries: mockAdminMetrics.seo.topSearchTerms.map(term => ({
      term: term.term,
      count: term.volume / 10
    })),
    bounceRateEstimate: mockAdminMetrics.traffic.bounceRate * 100,
    avgClicksPerDay: mockAdminMetrics.traffic.uniqueVisitors / 30,
    dailyTraffic: mockAdminMetrics.traffic.trafficByDay.map(day => ({
      date: day.date,
      views: day.visits,
      clicks: Math.floor(day.visits * 0.4)
    }))
  };
};

export const getSearchVisibilityMetrics = async (): Promise<SearchVisibilityMetrics> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    totalSearchImpressions: mockAdminMetrics.seo.totalKeywords * 50,
    topSearchTerms: mockAdminMetrics.seo.topSearchTerms.map(term => ({
      term: term.term,
      count: term.volume
    })),
    topCitiesSearched: mockSeoPerformance.cityRankings.map(city => ({
      city: city.city,
      count: city.searchVolume
    })),
    averageClicksPerSearch: 0.34,
    topServices: [
      { service: 'Testosterone Therapy', count: 4532 },
      { service: 'ED Treatment', count: 3876 },
      { service: 'Hormone Optimization', count: 2987 },
      { service: 'Weight Management', count: 2345 },
      { service: 'Sexual Health', count: 2123 }
    ],
    websiteHealth: mockAdminMetrics.websiteHealth
  };
};

export const getAllClinicsEngagement = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return mockAdminMetrics.engagement.topClinics.map(clinic => ({
    clinicId: String(clinic.id),
    clinicName: clinic.name,
    totalViews: clinic.views,
    viewsThisMonth: Math.floor(clinic.views * 0.4),
    lastViewed: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000))
  }));
};

export const getClinicEngagement = async (clinicId: string) => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const clinic = mockAdminMetrics.engagement.topClinics.find(c => String(c.id) === clinicId);
  if (!clinic) {
    return null;
  }
  
  return {
    clinicId,
    clinicName: clinic.name,
    totalViews: clinic.views,
    viewsThisMonth: Math.floor(clinic.views * 0.4),
    lastViewed: new Date(Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000)),
    viewsByDay: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000),
      count: Math.floor(Math.random() * 20) + 5,
    })),
  };
};

// Add more mock functions as needed for other admin features