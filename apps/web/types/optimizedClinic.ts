import { Timestamp } from 'firebase/firestore';

/**
 * Optimized Clinic Structure
 * Reduces from 97+ fields to ~35 essential fields
 * Includes business hours, payment methods, and review storage
 */
export interface OptimizedClinic {
  // Core Business Data (Required)
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string;
  website?: string;
  email?: string;
  
  // Business Hours (Valuable for profiles)
  hours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  
  // Tier & Status (Consolidated)
  tier: 'free' | 'standard' | 'advanced';
  isActive: boolean;
  isVerified: boolean;
  businessStatus: 'operational' | 'closed_temporarily' | 'closed_permanently';
  
  // External IDs (Only what we use)
  googlePlacesId?: string;
  
  // Aggregated Reviews
  totalReviews: number;
  averageRating: number;
  googleReviewCount?: number;
  
  // Payment Methods (Useful for patients)
  paymentMethods?: {
    cash?: boolean;
    creditCards?: boolean;
    insurance?: boolean;
    financing?: boolean;
  };
  
  // Key Services (Simplified)
  specializedServices: string[]; // ['TRT', 'ED', 'Peptides', 'Weight Loss']
  
  // Photos (URLs only, paid clinics only)
  photoUrls?: string[]; // Only populated for paid tiers
  
  // Discovery Metadata
  discoverySource?: string;
  discoveryDate?: Date | Timestamp;
  
  // Single Timestamp
  updatedAt: Date | Timestamp;
  
  // SEO (Single structure)
  seo?: {
    description: string;  // 500+ words for paid tiers
    keywords: string[];
    indexed: boolean;
  };
}

/**
 * Review Interface - Stored in subcollection
 * Path: clinics/{clinicId}/reviews/{reviewId}
 */
export interface ClinicReview {
  id: string;
  source: 'google' | 'native' | 'manual';
  rating: number;
  text: string;
  author: string;
  authorPhoto?: string;
  date: Date | Timestamp;
  verified: boolean;
  helpful?: number;
  reported?: boolean;
}

/**
 * Migration function to convert old format to optimized
 */
export function migrateToOptimizedClinic(oldClinic: any): OptimizedClinic {
  return {
    // Core data
    id: oldClinic.id || '',
    name: oldClinic.name || '',
    slug: oldClinic.slug || '',
    address: oldClinic.address || '',
    city: oldClinic.city || '',
    state: oldClinic.state || '',
    zip: oldClinic.zip || '',
    lat: oldClinic.lat || 0,
    lng: oldClinic.lng || 0,
    phone: oldClinic.phone || '',
    website: oldClinic.website,
    email: oldClinic.email,
    
    // Business hours
    hours: oldClinic.hours,
    
    // Status
    tier: oldClinic.tier || 'free',
    isActive: oldClinic.status === 'active' || oldClinic.status === 'Active',
    isVerified: oldClinic.verified || false,
    businessStatus: oldClinic.businessStatus || 'operational',
    
    // External IDs
    googlePlacesId: oldClinic.googlePlacesId,
    
    // Reviews
    totalReviews: oldClinic.reviewCount || 0,
    averageRating: oldClinic.rating || 0,
    googleReviewCount: oldClinic.googleReviewCount,
    
    // Payment methods
    paymentMethods: oldClinic.paymentMethods || {
      cash: true,
      creditCards: true,
      insurance: false,
      financing: false
    },
    
    // Services
    specializedServices: oldClinic.specializedServices || 
      (oldClinic.services || []).filter((s: string) => 
        ['TRT', 'ED', 'Peptides', 'Weight Loss', 'HRT', 'Wellness'].includes(s)
      ),
    
    // Photos (only URLs, only for paid)
    photoUrls: oldClinic.tier !== 'free' && oldClinic.photos?.googlePhotoUrls 
      ? oldClinic.photos.googlePhotoUrls 
      : undefined,
    
    // Metadata
    discoverySource: oldClinic.discoverySource,
    discoveryDate: oldClinic.discoveryDate || oldClinic.createdAt,
    updatedAt: oldClinic.updatedAt || new Date(),
    
    // SEO
    seo: oldClinic.seo
  };
}