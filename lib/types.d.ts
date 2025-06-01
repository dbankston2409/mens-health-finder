// Global type definitions

// Add GA4 window types
interface Window {
  dataLayer: any[];
  gtag: (...args: any[]) => void;
  MHF?: {
    analytics: {
      trackPageView: (path: string, title?: string) => void;
      trackClinicView: (clinicId: string, clinicSlug: string, clinicName: string) => void;
      trackClickToCall: (clinicId: string, clinicName: string, phoneNumber: string) => void;
      trackClickToWebsite: (clinicId: string, clinicName: string, websiteUrl: string) => void;
      trackClickToDirections: (clinicId: string, clinicName: string, address: string) => void;
      trackSearch: (query: string, resultCount: number, filters?: Record<string, any>) => void;
    };
  };
}