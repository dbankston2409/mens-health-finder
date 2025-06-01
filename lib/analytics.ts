/**
 * Client-side analytics module for tracking page views and events
 * Supports GA4 and Google Search Console
 */

// Add gtag type declaration
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    MHF?: {
      analytics?: Record<string, any>;
    };
  }
}

// GA4 tracking
export const trackPageView = (path: string, title?: string) => {
  try {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      page_path: path,
      page_title: title
    });
    
    console.debug(`[Analytics] Tracked page view: ${path}`);
  } catch (error) {
    console.error('Error tracking page view:', error);
  }
};

// Track clinic profile view
export const trackClinicView = (clinicId: string, clinicSlug: string, clinicName: string) => {
  try {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    // Get attribution params for tracking
    const attributionParams = getAttributionParams();
    
    window.gtag('event', 'clinic_view', {
      clinic_id: clinicId,
      clinic_slug: clinicSlug,
      clinic_name: clinicName,
      event_category: 'clinic',
      event_label: clinicName,
      ...attributionParams
    });
    
    // Also fire a virtual pageview for this clinic
    trackPageView(`/clinics/${clinicSlug}`, `${clinicName} | Men's Health Finder`);
    
    
    console.debug(`[Analytics] Tracked clinic view: ${clinicName} (${clinicId})`);
  } catch (error) {
    console.error('Error tracking clinic view:', error);
  }
};

// Track click to call
export const trackClickToCall = (clinicId: string, clinicName: string, phoneNumber: string) => {
  try {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    // Get attribution params for tracking
    const attributionParams = getAttributionParams();
    
    window.gtag('event', 'click_to_call', {
      clinic_id: clinicId,
      clinic_name: clinicName,
      phone_number: phoneNumber,
      event_category: 'lead',
      event_label: phoneNumber,
      ...attributionParams
    });
    
    
    console.debug(`[Analytics] Tracked click to call: ${phoneNumber} for ${clinicName}`);
  } catch (error) {
    console.error('Error tracking click to call:', error);
  }
};

// Track click to website
export const trackClickToWebsite = (clinicId: string, clinicName: string, websiteUrl: string) => {
  try {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'click_to_website', {
      clinic_id: clinicId,
      clinic_name: clinicName,
      website_url: websiteUrl,
      event_category: 'lead',
      event_label: websiteUrl
    });
    
    console.debug(`[Analytics] Tracked click to website: ${websiteUrl}`);
  } catch (error) {
    console.error('Error tracking click to website:', error);
  }
};

// Track click to directions
export const trackClickToDirections = (clinicId: string, clinicName: string, address: string) => {
  try {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'click_to_directions', {
      clinic_id: clinicId,
      clinic_name: clinicName,
      address,
      event_category: 'lead',
      event_label: address
    });
    
    console.debug(`[Analytics] Tracked click to directions: ${address}`);
  } catch (error) {
    console.error('Error tracking click to directions:', error);
  }
};

// Track search events
export const trackSearch = (query: string, resultCount: number, filters?: Record<string, any>) => {
  try {
    if (typeof window === 'undefined' || !window.gtag) return;
    
    window.gtag('event', 'search', {
      search_term: query,
      result_count: resultCount,
      ...filters,
      event_category: 'search',
      event_label: query
    });
    
    console.debug(`[Analytics] Tracked search: "${query}" (${resultCount} results)`);
  } catch (error) {
    console.error('Error tracking search:', error);
  }
};

// Extract UTM parameters from URL
export const getAttributionParams = (): Record<string, string> => {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  const attributionParams: Record<string, string> = {};
  
  // Extract all UTM parameters
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
    const value = urlParams.get(param);
    if (value) {
      attributionParams[param] = value;
    }
  });
  
  return attributionParams;
};

// Helper to get cookie value
const getCookie = (name: string): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return undefined;
};

// Initialize analytics
export const initAnalytics = () => {
  if (typeof window !== 'undefined' && !window.dataLayer) {
    // Initialize GA4
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    
    window.gtag('js', new Date());
    window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
      send_page_view: false // We'll handle page views manually
    });
    
    
    console.debug('[Analytics] Initialized analytics');
  }
};

// Helper: Make event tracking available globally for debugging
export const exposeAnalytics = () => {
  if (typeof window !== 'undefined') {
    window.MHF = window.MHF || {};
    window.MHF.analytics = {
      trackPageView,
      trackClinicView,
      trackClickToCall,
      trackClickToWebsite,
      trackClickToDirections,
      trackSearch,
      getAttributionParams
    };
  }
};