/**
 * Utility functions for tracking affiliate referrals and conversions
 */
import Cookies from 'js-cookie';
import { trackAffiliateConversion } from '../lib/api/affiliateService';

// Constants
const AFFILIATE_COOKIE_NAME = 'mhf_affiliate';
const AFFILIATE_REFERRAL_ID_NAME = 'mhf_referral_id';
const AFFILIATE_COOKIE_DAYS = 30;

/**
 * Get the stored affiliate code from cookies
 */
export const getAffiliateCode = (): string | undefined => {
  return Cookies.get(AFFILIATE_COOKIE_NAME);
};

/**
 * Get the stored referral ID from cookies
 */
export const getReferralId = (): string | undefined => {
  return Cookies.get(AFFILIATE_REFERRAL_ID_NAME);
};

/**
 * Track a conversion for the current affiliate referral
 * 
 * @param conversionType - Type of conversion (view, call, website_click, signup, tier_upgrade)
 * @param conversionValue - Optional monetary value of the conversion
 * @returns Promise resolving to success status
 */
export const trackConversion = async (
  conversionType: 'view' | 'call' | 'website_click' | 'signup' | 'tier_upgrade',
  conversionValue?: number
): Promise<boolean> => {
  try {
    // Get the referral ID from the cookie
    const referralId = getReferralId();
    
    // If no referral ID, there's nothing to track
    if (!referralId) {
      return false;
    }
    
    // Track the conversion in Firestore
    const result = await trackAffiliateConversion(
      referralId,
      conversionType,
      conversionValue
    );
    
    return result.success;
  } catch (error) {
    console.error('Error tracking affiliate conversion:', error);
    return false;
  }
};

/**
 * Track a clinic call as a conversion
 */
export const trackClinicCallConversion = async (
  clinicId: string,
  clinicTier: string
): Promise<boolean> => {
  // Calculate value based on clinic tier
  let conversionValue = 5; // Default $5 per call
  
  if (clinicTier === 'standard') {
    conversionValue = 8; // $8 per call for standard tier
  } else if (clinicTier === 'advanced') {
    conversionValue = 10; // $10 per call for advanced tier
  }
  
  return trackConversion('call', conversionValue);
};

/**
 * Track a signup conversion
 */
export const trackSignupConversion = async (
  signupTier: 'free' | 'standard' | 'advanced'
): Promise<boolean> => {
  // Calculate value based on signup tier
  let conversionValue = 0;
  
  if (signupTier === 'free') {
    conversionValue = 5; // $5 for free tier signup
  } else if (signupTier === 'standard') {
    conversionValue = 30; // $30 for standard tier signup
  } else if (signupTier === 'advanced') {
    conversionValue = 75; // $75 for advanced tier signup
  }
  
  return trackConversion('signup', conversionValue);
};

export default {
  getAffiliateCode,
  getReferralId,
  trackConversion,
  trackClinicCallConversion,
  trackSignupConversion
};