import { Timestamp } from 'firebase/firestore';

export interface ConversionEvent {
  id: string;
  clinicSlug: string;
  type: 'call' | 'form' | 'ctaClick' | 'email' | 'booking' | 'review';
  timestamp: Timestamp;
  referrer?: string;
  pageSlug: string;
  variantId?: string;
  userId?: string;
  sessionId: string;
  value?: number; // estimated revenue value
  metadata?: {
    formType?: string;
    ctaText?: string;
    elementId?: string;
    device?: 'mobile' | 'desktop' | 'tablet';
    browser?: string;
    source?: 'organic' | 'paid' | 'social' | 'direct' | 'referral';
    campaign?: string;
  };
}

export interface VariantTest {
  id: string;
  clinicSlug: string;
  name: string;
  description?: string;
  type: 'seoHeader' | 'cta' | 'description' | 'layout' | 'pricing' | 'testimonial';
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: {
    id: string;
    name: string;
    content: string;
    weight: number; // 0-100 percentage
    isControl: boolean;
  }[];
  assignedVisitors: Record<string, string>; // userId: variantId
  trafficAllocation: number; // 0-100 percentage of traffic to include
  startDate: Timestamp;
  endDate?: Timestamp;
  targetSampleSize: number;
  confidenceLevel: number; // 95, 99, etc.
  primaryMetric: 'conversion_rate' | 'ctr' | 'engagement_time' | 'bounce_rate';
  results?: {
    variantId: string;
    views: number;
    conversions: number;
    conversionRate: number;
    confidence: number;
    isWinner: boolean;
  }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface SessionEvent {
  id: string;
  userId: string;
  sessionId: string;
  clinicSlug?: string;
  steps: {
    action: 'page_view' | 'search' | 'filter' | 'clinic_view' | 'cta_click' | 'form_start' | 'form_submit' | 'call_click' | 'exit';
    page: string;
    timestamp: Timestamp;
    metadata?: Record<string, any>;
  }[];
  device: {
    type: 'mobile' | 'desktop' | 'tablet';
    browser: string;
    os: string;
  };
  location?: {
    city: string;
    state: string;
    country: string;
    lat?: number;
    lng?: number;
  };
  referrer?: string;
  source: 'organic' | 'paid' | 'social' | 'direct' | 'referral';
  campaign?: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  totalDuration?: number; // milliseconds
  isConverted: boolean;
  conversionValue?: number;
}

export interface ConversionFunnel {
  clinicSlug: string;
  period: 'day' | 'week' | 'month';
  date: string;
  steps: {
    name: string;
    count: number;
    percentage: number;
    dropoffRate?: number;
  }[];
  totalViews: number;
  totalConversions: number;
  overallConversionRate: number;
  averageTimeToConvert: number; // minutes
}

export interface UpgradeForecast {
  id: string;
  clinicSlug: string;
  forecastDate: Timestamp;
  upgradeMode: 'tier' | 'package' | 'feature';
  currentTier: string;
  targetTier: string;
  predictionScore: number; // 0-100
  confidence: 'low' | 'medium' | 'high';
  factors: {
    trafficTrend: number; // -1 to 1
    engagementScore: number; // 0-100
    revenueGrowth: number; // percentage
    competitorActivity: number; // 0-100
    seasonality: number; // -1 to 1
    contactFrequency: number; // days since last contact
  };
  predictedRevenue: number;
  timeframe: number; // days until predicted conversion
  recommendedActions: string[];
  createdAt: Timestamp;
  expiresAt: Timestamp;
}

export interface ForecastLog {
  id: string;
  clinicSlug: string;
  date: string;
  forecastType: 'upgrade' | 'revenue' | 'traffic' | 'conversion';
  prediction: any;
  actualOutcome?: any;
  accuracy?: number; // 0-100
  modelVersion: string;
  createdAt: Timestamp;
}

export const CONVERSION_VALUES = {
  call: 150, // average value of a phone call
  form: 100, // lead form submission
  ctaClick: 25, // CTA engagement
  email: 50, // email signup
  booking: 300, // direct booking
  review: 75 // review submission
};

export const FUNNEL_STEPS = [
  { name: 'Page View', action: 'page_view' },
  { name: 'Engagement', action: 'cta_click' },
  { name: 'Intent', action: 'form_start' },
  { name: 'Conversion', action: 'form_submit' }
];

export interface ConversionRate {
  clinicSlug: string;
  period: string;
  totalViews: number;
  totalConversions: number;
  conversionRate: number;
  segmentation: {
    byType: Record<string, { views: number; conversions: number; rate: number }>;
    bySource: Record<string, { views: number; conversions: number; rate: number }>;
    byDevice: Record<string, { views: number; conversions: number; rate: number }>;
    byVariant: Record<string, { views: number; conversions: number; rate: number }>;
  };
  trends: {
    daily: { date: string; rate: number }[];
    weekly: { week: string; rate: number }[];
  };
  updatedAt: Timestamp;
}