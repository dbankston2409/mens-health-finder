// Client-side stub for firebase-admin types
export type Timestamp = {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
} | Date;

/**
 * Options for filtering metric calculations
 */
export interface MetricOptions {
  startDate?: Timestamp | Date;
  endDate?: Timestamp | Date;
  clinicId?: string;
  limit?: number;
}

/**
 * Sales and revenue metrics interface
 */
export interface SalesMetrics {
  totalRevenueThisMonth: number;
  totalRevenueThisYear: number;
  newSignupsThisMonth: number;
  activeSubscriptions: number;
  churnedSubscriptions: number;
  averageRevenuePerClinic?: number;
  subscriptionsByPlan?: Record<string, number>; // e.g., { 'premium': 10, 'basic': 20 }
}

/**
 * Lost revenue metrics interface
 */
export interface LostRevenueMetrics {
  lostThisMonth: number;
  lostThisYear: number;
  breakdownByReason: Record<string, number>; // e.g., { 'canceled': 1000, 'downgrade': 500 }
  rawEvents?: LostRevenueEvent[];
}

/**
 * Individual lost revenue event
 */
export interface LostRevenueEvent {
  clinicId: string;
  clinicName: string;
  amount: number;
  reason: string;
  date: Timestamp;
}

/**
 * Traffic and engagement metrics
 */
export interface TrafficMetrics {
  totalClicksThisMonth: number;
  topPages: Array<{ slug: string; clickCount: number }>;
  topSearchQueries: Array<{ term: string; count: number }>;
  bounceRateEstimate?: number;
  avgClicksPerDay?: number;
  dailyTraffic?: Array<{ date: string; views: number; clicks: number }>;
}

/**
 * Search visibility metrics
 */
export interface SearchVisibilityMetrics {
  totalSearchImpressions: number;
  topSearchTerms: Array<{ term: string; count: number }>;
  topCitiesSearched: Array<{ city: string; count: number }>;
  averageClicksPerSearch: number;
  topServices?: Array<{ service: string; count: number }>;
  websiteHealth?: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    issuesByCategory: Record<string, string[]>;
  };
}

/**
 * Clinic engagement metrics
 */
export interface ClinicEngagementMetrics {
  totalViews: number;
  lastViewed: Timestamp | null;
  topSearchTerms: Array<{ term: string; count: number }>;
  avgTimeOnPageEstimate?: number;
  viewsThisMonth: number;
  viewsTrend?: 'up' | 'down' | 'stable';
}

/**
 * Subscription plan prices for revenue calculations
 */
export const PLAN_PRICES = {
  free: 0,
  basic: 49.99,
  premium: 199.99
};

/**
 * Estimated lost revenue by reason
 */
export const LOST_REVENUE_ESTIMATES = {
  canceled: 199.99,        // Premium plan canceled
  downgrade: 150,          // Premium to Basic downgrade
  failedPayment: 199.99,   // Failed payment for premium plan
  missedUpsell: 150,       // Missed opportunity to upgrade from basic to premium
  expiredTrial: 49.99      // Basic plan value when trial expires without conversion
};