import { getAnalytics, logEvent, setUserId, setUserProperties, Analytics } from 'firebase/analytics';
import { app } from './firebase';

let analytics: Analytics | null = null;

// Initialize analytics only in browser
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

// Event types for better type safety
export const AnalyticsEvents = {
  // Page views
  PAGE_VIEW: 'page_view',
  
  // Clinic events
  CLINIC_VIEW: 'clinic_view',
  CLINIC_SEARCH: 'clinic_search',
  CLINIC_FILTER: 'clinic_filter',
  CLINIC_CALL: 'clinic_call',
  CLINIC_WEBSITE_CLICK: 'clinic_website_click',
  CLINIC_SCHEDULE_CLICK: 'clinic_schedule_click',
  
  // User events
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  PROFILE_UPDATE: 'profile_update',
  
  // Review events
  REVIEW_START: 'review_start',
  REVIEW_SUBMIT: 'review_submit',
  REVIEW_VIEW: 'review_view',
  
  // Admin events
  ADMIN_IMPORT_START: 'admin_import_start',
  ADMIN_IMPORT_COMPLETE: 'admin_import_complete',
  ADMIN_CLINIC_UPDATE: 'admin_clinic_update',
  
  // Conversion events
  LEAD_GENERATED: 'lead_generated',
  APPOINTMENT_SCHEDULED: 'appointment_scheduled',
} as const;

// Helper function to log events
export function logAnalyticsEvent(
  eventName: keyof typeof AnalyticsEvents | string,
  parameters?: Record<string, any>
) {
  if (!analytics) return;
  
  try {
    logEvent(analytics, eventName, parameters);
    
    // Also send to Firestore for custom analytics
    if (typeof window !== 'undefined') {
      sendToFirestore(eventName, parameters);
    }
  } catch (error) {
    console.error('Analytics error:', error);
  }
}

// Send events to Firestore for custom analytics
async function sendToFirestore(eventName: string, parameters?: Record<string, any>) {
  try {
    const { db } = await import('./firestoreClient');
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    
    await addDoc(collection(db, 'analytics_events'), {
      event_type: eventName,
      parameters: parameters || {},
      timestamp: serverTimestamp(),
      user_agent: navigator.userAgent,
      url: window.location.href,
      referrer: document.referrer,
      // Add user ID if authenticated
      user_id: parameters?.user_id || 'anonymous',
    });
  } catch (error) {
    console.error('Failed to send analytics to Firestore:', error);
  }
}

// Set user ID for analytics
export function setAnalyticsUserId(userId: string | null) {
  if (!analytics) return;
  
  try {
    if (userId) {
      setUserId(analytics, userId);
    }
  } catch (error) {
    console.error('Failed to set user ID:', error);
  }
}

// Set user properties
export function setAnalyticsUserProperties(properties: Record<string, any>) {
  if (!analytics) return;
  
  try {
    setUserProperties(analytics, properties);
  } catch (error) {
    console.error('Failed to set user properties:', error);
  }
}

// Track page views automatically
export function trackPageView(pagePath?: string, pageTitle?: string) {
  logAnalyticsEvent(AnalyticsEvents.PAGE_VIEW, {
    page_path: pagePath || window.location.pathname,
    page_title: pageTitle || document.title,
  });
}

// Track clinic interactions
export function trackClinicView(clinicId: string, clinicName: string, tier: string) {
  logAnalyticsEvent(AnalyticsEvents.CLINIC_VIEW, {
    clinic_id: clinicId,
    clinic_name: clinicName,
    clinic_tier: tier,
  });
}

export function trackClinicCall(clinicId: string, clinicName: string, phone: string) {
  logAnalyticsEvent(AnalyticsEvents.CLINIC_CALL, {
    clinic_id: clinicId,
    clinic_name: clinicName,
    phone_number: phone,
  });
}

// Track search behavior
export function trackSearch(query: string, filters: Record<string, any>, resultCount: number) {
  logAnalyticsEvent(AnalyticsEvents.CLINIC_SEARCH, {
    search_query: query,
    filters: JSON.stringify(filters),
    result_count: resultCount,
  });
}

// Track conversions
export function trackLead(clinicId: string, leadType: string) {
  logAnalyticsEvent(AnalyticsEvents.LEAD_GENERATED, {
    clinic_id: clinicId,
    lead_type: leadType,
    value: 1,
  });
}