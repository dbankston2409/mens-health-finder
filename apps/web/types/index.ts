import { Timestamp } from 'firebase/firestore';

// Unified Clinic interface - single source of truth
export interface Clinic {
  id?: string;
  name: string;
  slug?: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  country?: string;
  lat?: number | null;
  lng?: number | null;
  phone: string;
  website?: string;
  email?: string;
  services?: string[];
  
  // Package/Tier (support both naming conventions)
  package?: 'Free' | 'Basic' | 'Premium' | string;
  packageTier?: 'free' | 'basic' | 'premium' | string;
  tier?: 'free' | 'low' | 'high' | string;
  
  // Status and metadata
  status?: 'Active' | 'Trial' | 'Paused' | 'Canceled' | 'active' | 'trial' | 'paused' | 'canceled' | string;
  joinDate?: string;
  lastContact?: string;
  engagementScore?: number;
  salesRep?: string;
  tags?: string[];
  notes?: string[];
  importSource?: string;
  
  // Reviews and ratings
  rating?: number;
  reviewCount?: number;
  googleRating?: number;
  googleReviewCount?: number;
  yelpRating?: number;
  yelpReviewCount?: number;
  verified?: boolean;
  
  // Timestamps
  createdAt?: Timestamp | Date;
  lastUpdated?: Timestamp | Date;
  
  // SEO and content
  seoMeta?: {
    title?: string;
    description?: string;
    keywords?: string[];
    indexed?: boolean;
    lastIndexed?: Date | Timestamp;
  };
  seoContent?: {
    title?: string;
    description?: string;
    content?: string;
    keywords?: string[];
  };
  
  // Analytics and tracking
  trafficMeta?: {
    totalClicks: number;
    topSearchTerms: string[];
    lastViewed: Timestamp | Date | null;
  };
  
  // Validation
  validationStatus?: {
    verified: boolean;
    method: string;
    websiteOK: boolean;
  };
  
  // UI specific properties
  description?: string;
  hours?: { day: string; hours: string; }[];
  faqs?: { question: string; answer: string; }[];
}

// Extended clinic for search results
export interface ExtendedClinic extends Clinic {
  distance?: number;
  relevanceScore?: number;
}

// Clinic location for maps
export interface ClinicLocation {
  id: string | number;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  tier: string;
  rating?: number;
  phone: string;
}

// Website health metrics
export interface WebsiteHealth {
  performance?: number;
  accessibility?: number;
  bestPractices?: number;
  seo?: number;
  issuesByCategory?: Record<string, string[]>;
  // Alternative format
  uptimeStatus?: string;
  avgLoadTime?: number;
  indexedPages?: number;
  errorPages?: number;
  lastChecked?: Date;
  speedScore?: number;
  seoScore?: number;
  accessibilityScore?: number;
}

// Lost revenue event
export interface LostRevenueEvent {
  clinicId: string;
  clinicName: string;
  amount: number;
  reason: string;
  date: Timestamp | Date;
}

// Utility types for safe object access
export type TierCounts = Record<'premium' | 'basic' | 'free', number>;
export type TierCountsFlexible = Record<string, number> & TierCounts;

// Tab types
export type TabType = 'search' | 'analytics' | 'overview';
export type ReportTabType = TabType | 'calls';

// PDF Mode
export type PDFMode = 'monthly' | 'quarterly' | 'annual';

// Auth context types
export interface AuthContextType {
  user: any | null;
  userData?: any;
}

// Firestore timestamp helper
export const toDate = (timestamp: Timestamp | Date | null | undefined): Date => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }
  if (typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  return new Date(timestamp as any);
};

// Clinic filter interface
export interface ClinicFilter {
  city?: string;
  state?: string;
  services?: string[];
  searchTerm?: string;
  tags?: string[];
  status?: string;
  package?: string;
  lat?: number;
  lng?: number;
  radius?: number;
}

// Safe object access helper
export const safeObjectAccess = <T>(obj: Record<string, T> | undefined, key: string, defaultValue: T): T => {
  return obj?.[key] ?? defaultValue;
};