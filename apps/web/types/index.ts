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
  imageUrl?: string;
  
  // Tier system
  tier: 'free' | 'standard' | 'advanced';
  
  // Legacy fields (for backward compatibility)
  package?: 'Free' | 'Basic' | 'Premium' | string;
  packageTier?: 'free' | 'basic' | 'premium' | string;
  
  // Status and metadata
  status?: 'Active' | 'Trial' | 'Paused' | 'Canceled' | 'active' | 'trial' | 'paused' | 'canceled' | string;
  joinDate?: string;
  signUpDate?: Date | string;
  lastContact?: string;
  lastContacted?: Date | string | null;
  engagementScore?: number;
  salesRep?: string;
  tags?: string[];
  notes?: string[];
  importSource?: string;
  websiteStatus?: 'up' | 'down' | 'unknown';
  verificationStatus?: 'verified' | 'pending' | 'failed';
  verificationMethod?: string;
  
  // External IDs for data fetching
  googlePlacesId?: string;
  externalIds?: {
    google?: string;
    healthgrades?: string;
  };

  // Reviews and ratings
  rating?: number;
  reviewCount?: number;
  googleRating?: number;
  googleReviewCount?: number;
  healthgradesRating?: number;
  healthgradesReviewCount?: number;
  verified?: boolean;
  reviewStats?: {
    averageRating: number;
    count: number;
    distribution?: Record<string, number>;
  };

  // Business Intelligence
  priceLevel?: 1 | 2 | 3 | 4;
  priceBracket?: '$' | '$$' | '$$$' | '$$$$';
  businessStatus?: 'operational' | 'closed_temporarily' | 'closed_permanently';

  // Accessibility & Services
  accessibility?: {
    wheelchairAccessible?: boolean;
    hasParking?: boolean;
    parkingType?: 'street' | 'lot' | 'garage' | 'valet';
    acceptsInsurance?: boolean;
    languagesSpoken?: string[];
  };

  // Payment Methods
  paymentMethods?: {
    cash?: boolean;
    creditCards?: boolean;
    debitCards?: boolean;
    nfc?: boolean;
    bitcoin?: boolean;
    financing?: boolean;
  };

  // Rich Media - URLs only for storage efficiency
  photos?: {
    googlePhotoUrls?: string[];
    hero?: string;
    gallery?: string[];
  };

  // Social Presence
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
  };

  // Contact Methods
  contactMethods?: {
    phone: string;
    alternatePhone?: string;
    email?: string;
    contactForm?: string;
    messaging?: any;
    bookingUrl?: string;
  };

  // Specialized Services (Men's Health)
  specializedServices?: {
    trt?: boolean;
    ed?: boolean;
    weightLoss?: boolean;
    peptides?: boolean;
    hrt?: boolean;
    wellness?: boolean;
    telehealth?: boolean;
  };

  // Discovery metadata
  discoverySession?: string;
  discoveryGrid?: string;
  enhancementStatus?: 'basic' | 'enhanced' | 'complete';
  
  // Timestamps
  createdAt?: Timestamp | Date;
  lastUpdated?: Timestamp | Date;
  updatedAt?: Timestamp | Date;
  
  // SEO and content
  seo?: {
    description: string; // 500+ word markdown
    keywords: string[];
    title?: string;
    indexed?: boolean;
    lastIndexed?: Date | Timestamp;
  };
  
  // Features enabled based on tier
  tierFeatures?: {
    fullProfile: boolean;
    seoDescription: boolean;
    publicContact: boolean;
    locationMapping: boolean;
    basicSearch: boolean;
    verifiedBadge: boolean;
    enhancedSearch: boolean;
    treatmentsLimit: number;
    reviewDisplay: 'basic' | 'enhanced' | 'premium';
    enhancedContactUX: boolean;
    customTracking: boolean;
    snapshotReport: boolean;
    priorityListing: boolean;
  };
  
  // Legacy SEO fields (for backward compatibility)
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
  tier: 'free' | 'standard' | 'advanced';
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
export type TierCounts = Record<'advanced' | 'standard' | 'free', number>;
export type TierCountsFlexible = Record<string, number> & TierCounts;

// Legacy tier counts (for backward compatibility)
export type LegacyTierCounts = Record<'premium' | 'basic' | 'free', number>;

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
    return (timestamp as any).toDate();
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
  tier?: 'free' | 'standard' | 'advanced';
  package?: string; // Legacy field
  lat?: number;
  lng?: number;
  radius?: number;
  verified?: boolean;
}

// Discovery and Enhancement Types
export interface GooglePhoto {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

export interface DiscoveryGrid {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  priority: 1 | 2 | 3;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  searchTermsUsed: string[];
  clinicsFound: number;
  lastSearched?: Date;
  area?: string;
}

export interface DiscoverySession {
  id: string;
  name: string;
  targetCount: number;
  niche: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
  currentGrid?: string;
  gridsCompleted: string[];
  gridsRemaining: string[];
  stats: {
    totalGrids: number;
    searchedGrids: number;
    clinicsFound: number;
    apiCalls: number;
    apiCost: number;
    duplicatesFound: number;
  };
  config: {
    strategy: 'metro_first' | 'nationwide' | 'state_by_state';
    gridSpacing: number;
    searchTerms: string[];
    enhancementLevel: 'basic' | 'enhanced' | 'complete';
  };
  createdAt: Date;
  lastUpdated: Date;
  lastResumed?: Date;
}

export interface SearchNiche {
  id: string;
  name: string;
  searchTerms: string[];
  googleTypes: string[];
  excludeTerms?: string[];
  description: string;
}

// Safe object access helper
export const safeObjectAccess = <T>(obj: Record<string, T> | undefined, key: string, defaultValue: T): T => {
  return obj?.[key] ?? defaultValue;
};