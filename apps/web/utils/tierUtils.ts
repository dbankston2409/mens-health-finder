import { Clinic } from '@/types';

/**
 * TierFeatures interface representing the features available to each tier
 */
export interface TierFeatures {
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
}

/**
 * Converts legacy tier values to standardized tier enum
 * @param legacyTier The legacy tier value to convert
 * @returns Standardized tier enum value
 */
export function convertToStandardTier(legacyTier: string | undefined): 'free' | 'standard' | 'advanced' {
  if (!legacyTier) return 'free';
  
  const normalized = legacyTier.toLowerCase();
  
  if (['premium', 'high', 'advanced', 'pro', 'deluxe'].includes(normalized)) {
    return 'advanced';
  }
  
  if (['basic', 'standard', 'low', 'mid', 'medium'].includes(normalized)) {
    return 'standard';
  }
  
  return 'free';
}

/**
 * Generates tier features based on the tier
 * @param tier The tier to generate features for
 * @returns Object containing feature flags for the specified tier
 */
export function generateTierFeatures(tier: 'free' | 'standard' | 'advanced'): TierFeatures {
  return {
    // Base features - all tiers get these
    fullProfile: true,
    seoDescription: true,
    publicContact: true,
    locationMapping: true,
    basicSearch: true,
    
    // Standard tier features
    verifiedBadge: tier !== 'free',
    enhancedSearch: tier !== 'free',
    treatmentsLimit: tier === 'free' ? 5 : (tier === 'standard' ? 10 : 20),
    reviewDisplay: tier === 'free' ? 'basic' : (tier === 'standard' ? 'enhanced' : 'premium'),
    
    // Advanced tier features
    enhancedContactUX: tier === 'advanced',
    customTracking: tier === 'advanced',
    snapshotReport: tier === 'advanced',
    priorityListing: tier === 'advanced'};
}

/**
 * Checks if a clinic has a specific feature
 * @param clinic The clinic to check
 * @param feature The feature name to check
 * @returns Whether the clinic has the specified feature
 */
export function hasFeature(clinic: Clinic, feature: keyof Omit<TierFeatures, 'treatmentsLimit' | 'reviewDisplay'>): boolean {
  // If tierFeatures exists, use it directly
  if (clinic.tierFeatures && feature in clinic.tierFeatures) {
    return clinic.tierFeatures[feature] as boolean;
  }
  
  // Otherwise, generate features based on tier
  const tier = clinic.tier || convertToStandardTier(clinic.package || clinic.packageTier);
  const features = generateTierFeatures(tier);
  
  return features[feature];
}

/**
 * Gets the treatments limit for a clinic
 * @param clinic The clinic to check
 * @returns The number of treatments allowed
 */
export function getTreatmentsLimit(clinic: Clinic): number {
  // If tierFeatures exists, use it directly
  if (clinic.tierFeatures?.treatmentsLimit !== undefined) {
    return clinic.tierFeatures.treatmentsLimit;
  }
  
  // Otherwise, generate features based on tier
  const tier = clinic.tier || convertToStandardTier(clinic.package || clinic.packageTier);
  const features = generateTierFeatures(tier);
  
  return features.treatmentsLimit;
}

/**
 * Gets the review display level for a clinic
 * @param clinic The clinic to check
 * @returns The review display level ('basic', 'enhanced', or 'premium')
 */
export function getReviewDisplayLevel(clinic: Clinic): 'basic' | 'enhanced' | 'premium' {
  // If tierFeatures exists, use it directly
  if (clinic.tierFeatures?.reviewDisplay) {
    return clinic.tierFeatures.reviewDisplay;
  }
  
  // Otherwise, generate features based on tier
  const tier = clinic.tier || convertToStandardTier(clinic.package || clinic.packageTier);
  const features = generateTierFeatures(tier);
  
  return features.reviewDisplay;
}

/**
 * Determines if a clinic is eligible for an upgrade
 * @param clinic The clinic to check
 * @returns Whether the clinic is eligible for an upgrade
 */
export function isEligibleForUpgrade(clinic: Clinic): boolean {
  const tier = clinic.tier || convertToStandardTier(clinic.package || clinic.packageTier);
  return tier !== 'advanced';
}

/**
 * Gets the next upgrade tier for a clinic
 * @param clinic The clinic to check
 * @returns The next tier or null if already at top tier
 */
export function getNextUpgradeTier(clinic: Clinic): 'standard' | 'advanced' | null {
  const tier = clinic.tier || convertToStandardTier(clinic.package || clinic.packageTier);
  
  if (tier === 'free') return 'standard';
  if (tier === 'standard') return 'advanced';
  return null;
}

/**
 * Gets tier display name for user-facing interfaces
 * @param tier The tier to get the display name for
 * @returns User-friendly tier name
 */
export function getTierDisplayName(tier: 'free' | 'standard' | 'advanced'): string {
  switch (tier) {
    case 'advanced': return 'Advanced';
    case 'standard': return 'Standard';
    case 'free': return 'Free';
    default: return 'Unknown';
  }
}