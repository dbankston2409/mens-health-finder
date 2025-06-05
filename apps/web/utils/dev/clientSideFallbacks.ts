/**
 * Client-side fallbacks for server-side Firebase functions
 * Used to prevent errors when server-side code is imported into client-side bundle
 */

// Import types only
import { SalesMetrics, LostRevenueMetrics, TrafficMetrics, SearchVisibilityMetrics } from '../metrics/types';

// Re-export empty functions with the same signatures as the server-side functions
export const getSalesMetrics = async (): Promise<SalesMetrics> => {
  // Return empty data
  return {
    totalRevenueThisMonth: 0,
    totalRevenueThisYear: 0,
    newSignupsThisMonth: 0,
    activeSubscriptions: 0,
    churnedSubscriptions: 0,
    averageRevenuePerClinic: 0,
    subscriptionsByPlan: {
      'Basic': 0,
      'Premium': 0,
      'Free': 0
    }
  };
};

export const getLostRevenue = async (): Promise<LostRevenueMetrics> => {
  // Return empty data
  return {
    lostThisMonth: 0,
    lostThisYear: 0,
    breakdownByReason: {
      canceled: 0,
      downgrade: 0,
      failedPayment: 0,
      missedUpsell: 0,
      expiredTrial: 0
    },
    rawEvents: []
  };
};

export const getTrafficMetrics = async (): Promise<TrafficMetrics> => {
  // Return empty data
  return {
    sessionsThisMonth: 0,
    sessionsLastMonth: 0,
    pageViewsThisMonth: 0,
    pageViewsLastMonth: 0,
    topTrafficSources: [],
    topVisitedClinics: []
  };
};

export const getSearchVisibilityMetrics = async (): Promise<SearchVisibilityMetrics> => {
  // Return empty data
  return {
    totalImpressions: 0,
    totalClicks: 0,
    averageCTR: 0,
    averagePosition: 0,
    topSearchQueries: [],
    topRankedClinics: []
  };
};

// Client-side fallback for queue data
export const getClinicQueueData = async () => {
  return [];
};

// Client-side fallback for clinic details
export const getClinicDetails = async (id: string) => {
  return null;
};

// Client-side fallback for clinic engagement data
export const getAllClinicsEngagement = async () => {
  return [];
};

// Client-side fallback for single clinic engagement
export const getClinicEngagement = async (clinicId: string) => {
  return {
    clinicId,
    clinicName: '',
    totalViews: 0,
    viewsThisMonth: 0,
    lastViewed: null
  };
};