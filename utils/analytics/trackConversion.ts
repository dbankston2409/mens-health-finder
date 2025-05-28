import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, getDoc, Timestamp, increment } from 'firebase/firestore';
import { ConversionEvent, CONVERSION_VALUES } from './conversionModels';

export interface TrackConversionData {
  clinicSlug: string;
  type: ConversionEvent['type'];
  pageSlug: string;
  variantId?: string;
  userId?: string;
  sessionId: string;
  metadata?: ConversionEvent['metadata'];
}

export async function trackConversion(data: TrackConversionData): Promise<string> {
  try {
    // Get current page referrer
    const referrer = typeof window !== 'undefined' ? document.referrer : undefined;
    
    // Create conversion event
    const conversionEvent: Omit<ConversionEvent, 'id'> = {
      clinicSlug: data.clinicSlug,
      type: data.type,
      timestamp: Timestamp.now(),
      referrer,
      pageSlug: data.pageSlug,
      variantId: data.variantId,
      userId: data.userId,
      sessionId: data.sessionId,
      value: CONVERSION_VALUES[data.type],
      metadata: {
        ...data.metadata,
        device: getDeviceType(),
        browser: getBrowserInfo(),
        source: getTrafficSource(referrer)
      }
    };

    // Add to Firestore
    const eventRef = await addDoc(collection(db, 'conversionEvents'), conversionEvent);

    // Update clinic conversion metrics
    await updateClinicConversionMetrics(data.clinicSlug, data.type);

    // Update A/B test results if variant is specified
    if (data.variantId) {
      await updateVariantTestResults(data.clinicSlug, data.variantId, 'conversion');
    }

    // Update session with conversion flag
    await updateSessionConversion(data.sessionId, data.type, CONVERSION_VALUES[data.type]);

    console.log(`Conversion tracked: ${data.type} for ${data.clinicSlug}`);
    return eventRef.id;
  } catch (error) {
    console.error('Error tracking conversion:', error);
    throw new Error('Failed to track conversion');
  }
}

export async function trackCallClick(clinicSlug: string, phoneNumber: string, pageSlug: string, variantId?: string): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const userId = getUserId();

  await trackConversion({
    clinicSlug,
    type: 'call',
    pageSlug,
    variantId,
    userId,
    sessionId,
    metadata: {
      ctaText: `Call ${phoneNumber}`,
      elementId: 'phone-cta'
    }
  });
}

export async function trackFormSubmission({
  clinicSlug,
  formType,
  pageSlug,
  formData,
  variantId
}: {
  clinicSlug: string;
  formType: string;
  pageSlug: string;
  formData: Record<string, any>;
  variantId?: string;
}): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const userId = getUserId();

  await trackConversion({
    clinicSlug,
    type: 'form',
    pageSlug,
    variantId,
    userId,
    sessionId,
    metadata: {
      formType,
      elementId: `${formType}-form`
    }
  });
}

export async function trackCTAClick({
  clinicSlug,
  ctaText,
  pageSlug,
  elementId,
  variantId
}: {
  clinicSlug: string;
  ctaText: string;
  pageSlug: string;
  elementId: string;
  variantId?: string;
}): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const userId = getUserId();

  await trackConversion({
    clinicSlug,
    type: 'ctaClick',
    pageSlug,
    variantId,
    userId,
    sessionId,
    metadata: {
      ctaText,
      elementId
    }
  });
}

export async function trackEmailSignup({
  clinicSlug,
  email,
  pageSlug,
  variantId
}: {
  clinicSlug: string;
  email: string;
  pageSlug: string;
  variantId?: string;
}): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const userId = getUserId();

  await trackConversion({
    clinicSlug,
    type: 'email',
    pageSlug,
    variantId,
    userId,
    sessionId,
    metadata: {
      elementId: 'email-signup'
    }
  });
}

export async function trackBooking({
  clinicSlug,
  serviceType,
  appointmentDate,
  pageSlug,
  variantId
}: {
  clinicSlug: string;
  serviceType: string;
  appointmentDate: Date;
  pageSlug: string;
  variantId?: string;
}): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const userId = getUserId();

  await trackConversion({
    clinicSlug,
    type: 'booking',
    pageSlug,
    variantId,
    userId,
    sessionId,
    metadata: {
      serviceType,
      appointmentDate: appointmentDate.toISOString(),
      elementId: 'booking-form'
    }
  });
}

async function updateClinicConversionMetrics(clinicSlug: string, conversionType: string): Promise<void> {
  const clinicRef = doc(db, 'clinics', clinicSlug);
  
  await updateDoc(clinicRef, {
    [`conversionMetrics.total`]: increment(1),
    [`conversionMetrics.${conversionType}`]: increment(1),
    [`conversionMetrics.lastConversion`]: Timestamp.now()
  });
}

async function updateVariantTestResults(clinicSlug: string, variantId: string, action: 'view' | 'conversion'): Promise<void> {
  // Find active variant test for this clinic
  // Update the specific variant's metrics
  // This would need to query variantTests collection
  console.log(`Updating variant ${variantId} for ${action}`);
}

async function updateSessionConversion(sessionId: string, conversionType: string, value: number): Promise<void> {
  const sessionRef = doc(db, 'sessionEvents', sessionId);
  
  try {
    await updateDoc(sessionRef, {
      isConverted: true,
      conversionValue: increment(value),
      [`conversions.${conversionType}`]: increment(1)
    });
  } catch (error) {
    console.warn('Could not update session conversion:', error);
  }
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getBrowserInfo(): string {
  if (typeof window === 'undefined') return 'unknown';
  
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'chrome';
  if (userAgent.includes('Firefox')) return 'firefox';
  if (userAgent.includes('Safari')) return 'safari';
  if (userAgent.includes('Edge')) return 'edge';
  return 'other';
}

function getTrafficSource(referrer?: string): 'organic' | 'paid' | 'social' | 'direct' | 'referral' {
  if (!referrer) return 'direct';
  
  const url = new URL(referrer);
  const domain = url.hostname.toLowerCase();
  
  // Search engines
  if (domain.includes('google') || domain.includes('bing') || domain.includes('yahoo')) {
    return url.searchParams.get('gclid') ? 'paid' : 'organic';
  }
  
  // Social media
  if (domain.includes('facebook') || domain.includes('twitter') || domain.includes('linkedin') || domain.includes('instagram')) {
    return 'social';
  }
  
  return 'referral';
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return `session_${Date.now()}`;
  
  let sessionId = sessionStorage.getItem('mhf_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('mhf_session_id', sessionId);
  }
  return sessionId;
}

function getUserId(): string {
  if (typeof window === 'undefined') return `user_${Date.now()}`;
  
  let userId = localStorage.getItem('mhf_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('mhf_user_id', userId);
  }
  return userId;
}