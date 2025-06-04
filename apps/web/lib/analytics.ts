// Google Analytics event tracking
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url});
  }
};

// Track custom events
export const event = ({
  action,
  category,
  label,
  value}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value});
  }
};

// Track clinic imports
export const trackClinicImport = (source: string, count: number) => {
  event({
    action: 'clinic_import',
    category: 'data_management',
    label: source,
    value: count});
};

// Track discovery session
export const trackDiscoverySession = (status: 'started' | 'completed' | 'paused', clinicsFound: number) => {
  event({
    action: `discovery_${status}`,
    category: 'business_discovery',
    label: `${clinicsFound} clinics`,
    value: clinicsFound});
};

// Track clinic page views
export const trackClinicView = (clinicId: string, tier: string) => {
  event({
    action: 'clinic_view',
    category: 'engagement',
    label: `${tier}_tier`,
    value: 1});
};

// Track affiliate clicks
export const trackAffiliateClick = (providerId: string, category: string) => {
  event({
    action: 'affiliate_click',
    category: 'monetization',
    label: `${providerId}_${category}`,
    value: 1});
};