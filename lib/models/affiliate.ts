/**
 * Affiliate Partner System Types and Models
 */

import { Timestamp } from 'firebase/firestore';

// Affiliate Partner record
export interface Affiliate {
  id?: string;
  code: string;           // Unique referral code (e.g., 'drsmith')
  name: string;           // Name of partner
  email: string;          // Contact email
  website?: string;       // Partner's website
  phone?: string;         // Contact phone
  type: AffiliateType;    // Type of affiliate
  payoutTier: PayoutTier; // Payout tier for commission structure
  createdAt: Timestamp;   // When the affiliate was created
  lastUpdated?: Timestamp; // When the affiliate was last updated
  
  // Status and activity
  isActive: boolean;      // Whether the affiliate is active
  lastLogin?: Timestamp;  // When the affiliate last logged in (if they have access)
  
  // Marketing
  customLandingPage?: boolean; // Whether they have a custom landing page
  shortLinks?: string[];  // List of custom short links
  
  // Payment details
  paymentMethod?: 'paypal' | 'ach' | 'check' | 'other';
  paymentDetails?: Record<string, any>; // JSON structure with payment details
  
  // Stats (updated via Cloud Functions)
  stats: {
    referralClicks: number; // Total tracked clicks
    uniqueVisitors: number; // Unique visitors from this affiliate
    conversionCount: number; // Total conversions attributed
    lastReferral?: Timestamp; // Last time a referral was tracked
    lastPayout?: {
      amount: number;
      date: Timestamp;
      reference: string;
    };
    totalPaid?: number; // Total paid out to this affiliate
  };
  
  // Notes and metadata
  notes?: string[];
  tags?: string[];
  adminId?: string; // Admin who manages this affiliate
}

// Types of affiliates
export type AffiliateType = 'influencer' | 'clinic' | 'media' | 'partner' | 'employee' | 'other';

// Payout tiers for commission structure
export type PayoutTier = 'standard' | 'premium' | 'elite' | 'custom';

// Commission rates by tier and lead type
export const COMMISSION_RATES: Record<PayoutTier, Record<string, number>> = {
  standard: {
    view: 0, // $0 per view
    call: 5, // $5 per call
    signup: 30 // $30 per signup
  },
  premium: {
    view: 0,
    call: 8,
    signup: 50
  },
  elite: {
    view: 0.1, // $0.10 per view
    call: 10,
    signup: 75
  },
  custom: {
    view: 0,
    call: 0,
    signup: 0
    // Custom rates are defined per-affiliate
  }
};

// Referral tracking record (stored in 'referrals' subcollection)
export interface AffiliateReferral {
  id?: string;
  affiliateId: string;    // Reference to the affiliate
  affiliateCode: string;  // Redundant for quick lookups
  timestamp: Timestamp;   // When the referral occurred
  
  // Attribution
  clientIp?: string;      // Anonymized client IP (for deduplication)
  sessionId?: string;     // Session ID (for tracking user journey)
  utmParams?: Record<string, string>; // UTM parameters
  
  // What was referred to
  targetType: 'clinic' | 'signup' | 'blog' | 'homepage';
  targetId?: string;      // ID of the target (e.g., clinicId)
  targetUrl: string;      // Full URL of the target
  
  // Conversion data
  converted?: boolean;    // Whether this referral resulted in a conversion
  conversionType?: 'view' | 'call' | 'website_click' | 'signup' | 'tier_upgrade';
  conversionTimestamp?: Timestamp; // When the conversion occurred
  conversionValue?: number; // Value of the conversion for commission
  
  // Payout status
  isPaid?: boolean;       // Whether this referral has been paid out
  payoutId?: string;      // Reference to the payout record
  payoutAmount?: number;  // Amount paid for this referral
}

// Payout record
export interface AffiliatePayout {
  id?: string;
  affiliateId: string;    // Reference to the affiliate
  amount: number;         // Total payout amount
  currency: string;       // Currency code (e.g., 'USD')
  date: Timestamp;        // When the payout was processed
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // Payment details
  method: 'paypal' | 'ach' | 'check' | 'other';
  reference?: string;     // Transaction reference
  
  // Referrals included in this payout
  referralIds: string[];  // IDs of referrals included
  referralCount: number;  // Count of referrals
  dateRange: {            // Date range of referrals
    start: Timestamp;
    end: Timestamp;
  };
  
  // Admin details
  adminId: string;        // Admin who processed the payout
  notes?: string;         // Notes about the payout
}