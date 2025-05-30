import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../apps/web/lib/firebase';
import FirestoreClient from './firestoreClient';
import { getUtmParams } from './analytics';

// Define lead source types
export type LeadSource = 'organic' | 'paid' | 'social' | 'referral' | 'direct' | 'email' | 'unknown';

export interface LeadData {
  clinicId: string;
  source: LeadSource;
  type: 'call' | 'website' | 'directions' | 'contact_form';
  timestamp: Date;
  utmParams?: Record<string, string>;
  userAgent?: string;
  ipAddress?: string;
  geoLocation?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Track a lead to a specific clinic
 * 
 * @param clinicId The ID of the clinic
 * @param leadType The type of lead (call, website visit, etc)
 * @param source The source of the lead (organic, paid, etc)
 */
export const trackLead = async (
  clinicId: string,
  leadType: 'call' | 'website' | 'directions' | 'contact_form',
  source: LeadSource = 'unknown'
): Promise<boolean> => {
  try {
    if (!clinicId) {
      console.error('Cannot track lead: Missing clinic ID');
      return false;
    }
    
    // Get UTM parameters
    const utmParams = getUtmParams();
    
    // Determine source from UTM if available
    if (utmParams.utm_source) {
      if (utmParams.utm_source === 'google' && utmParams.utm_medium === 'cpc') {
        source = 'paid';
      } else if (['facebook', 'instagram', 'twitter', 'linkedin'].includes(utmParams.utm_source)) {
        source = 'social';
      } else if (utmParams.utm_medium === 'email') {
        source = 'email';
      } else if (utmParams.utm_medium === 'referral') {
        source = 'referral';
      }
    }
    
    // Create lead data
    const leadData: Omit<LeadData, 'timestamp'> & {timestamp: any} = {
      clinicId,
      type: leadType,
      source,
      timestamp: serverTimestamp(),
      utmParams: Object.keys(utmParams).length > 0 ? utmParams : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    };
    
    // Add lead to Firestore
    const leadsRef = collection(db, 'clinics', clinicId, 'leads');
    await addDoc(leadsRef, leadData);
    
    // Increment the appropriate interaction counter
    if (leadType === 'call') {
      await FirestoreClient.incrementClinicInteraction(clinicId, 'clickToCallCount');
    } else if (leadType === 'website') {
      await FirestoreClient.incrementClinicInteraction(clinicId, 'clickToWebsiteCount');
    } else if (leadType === 'directions') {
      await FirestoreClient.incrementClinicInteraction(clinicId, 'clickToDirectionsCount');
    }
    
    console.debug(`[Lead Tracker] Tracked ${leadType} lead for clinic ${clinicId}`);
    return true;
  } catch (error) {
    console.error('Error tracking lead:', error);
    return false;
  }
};

/**
 * Track a page view for a clinic
 * 
 * @param clinicId The ID of the clinic
 * @param source The source of the traffic
 */
export const trackClinicView = async (clinicId: string, source: LeadSource = 'unknown'): Promise<boolean> => {
  try {
    if (!clinicId) {
      console.error('Cannot track clinic view: Missing clinic ID');
      return false;
    }
    
    // Increment the view counter
    await FirestoreClient.incrementClinicInteraction(clinicId, 'viewCount');
    
    // Get UTM parameters
    const utmParams = getUtmParams();
    
    // Create view data with UTM parameters
    const viewData = {
      clinicId,
      timestamp: serverTimestamp(),
      source,
      utmParams: Object.keys(utmParams).length > 0 ? utmParams : undefined,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    };
    
    // Add to clinic_views collection
    const viewsRef = collection(db, 'clinic_views');
    await addDoc(viewsRef, viewData);
    
    console.debug(`[Lead Tracker] Tracked view for clinic ${clinicId}`);
    return true;
  } catch (error) {
    console.error('Error tracking clinic view:', error);
    return false;
  }
};

/**
 * Determine lead source from URL and referrer
 */
export const determineLeadSource = (): LeadSource => {
  if (typeof window === 'undefined') return 'unknown';
  
  const utmParams = getUtmParams();
  const referrer = document.referrer;
  
  // Check UTM parameters first
  if (utmParams.utm_source) {
    if (utmParams.utm_source === 'google' && utmParams.utm_medium === 'cpc') {
      return 'paid';
    } else if (['facebook', 'instagram', 'twitter', 'linkedin'].includes(utmParams.utm_source)) {
      return 'social';
    } else if (utmParams.utm_medium === 'email') {
      return 'email';
    } else if (utmParams.utm_medium === 'referral') {
      return 'referral';
    }
  }
  
  // Check referrer domain
  if (referrer) {
    try {
      const referrerDomain = new URL(referrer).hostname;
      
      if (referrerDomain.includes('google')) {
        return 'organic';
      } else if (['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com'].some(
        domain => referrerDomain.includes(domain)
      )) {
        return 'social';
      } else if (referrerDomain !== window.location.hostname) {
        return 'referral';
      }
    } catch (e) {
      // Invalid referrer URL
    }
  }
  
  // Default to direct if no referrer
  return referrer ? 'unknown' : 'direct';
};

export default {
  trackLead,
  trackClinicView,
  determineLeadSource
};