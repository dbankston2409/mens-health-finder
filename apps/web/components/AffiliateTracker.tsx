import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import useAffiliateTracking from '../utils/hooks/useAffiliateTracking';
import { trackReferralClick } from '../../../lib/api/affiliateService';

// Session storage keys and cookie names
const SESSION_ID_KEY = 'mhf_session_id';
const AFFILIATE_REFERRAL_ID_NAME = 'mhf_referral_id';

const AffiliateTracker: React.FC = () => {
  const router = useRouter();
  const { affiliateCode, sessionId } = useAffiliateTracking();
  
  // Handle page navigation for tracking
  useEffect(() => {
    const handleRouteChange = async (url: string) => {
      // Skip if no affiliate code
      if (!affiliateCode) return;
      
      try {
        // Determine the target type and ID based on the URL
        const path = url.split('?')[0]; // Remove query params
        
        let targetType: 'clinic' | 'signup' | 'blog' | 'homepage' = 'homepage';
        let targetId: string | undefined = undefined;
        
        if (path.includes('/clinic/')) {
          targetType = 'clinic';
          targetId = path.split('/').pop() || undefined;
        } else if (path.includes('/blog/')) {
          targetType = 'blog';
          targetId = path.split('/').pop() || undefined;
        } else if (path.includes('/signup') || path.includes('/login')) {
          targetType = 'signup';
        }
        
        // Get UTM parameters for additional attribution
        const utmParams: Record<string, string> = {};
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
            const value = urlParams.get(param);
            if (value) {
              utmParams[param] = value;
            }
          });
        }
        
        // Track the referral in Firestore
        const result = await trackReferralClick(
          affiliateCode,
          url,
          targetType,
          targetId,
          {
            sessionId,
            utmParams
          }
        );
        
        // If successful, store the referral ID in a cookie for conversion tracking
        if (result.success && result.referralId) {
          Cookies.set(AFFILIATE_REFERRAL_ID_NAME, result.referralId, { expires: 1 }); // 1 day expiry for conversions
        }
      } catch (error) {
        console.error('Error tracking affiliate page view:', error);
      }
    };
    
    // Track initial page load
    if (router.isReady && affiliateCode) {
      handleRouteChange(window.location.href);
    }
    
    // Set up router event listener for subsequent navigation
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router, affiliateCode, sessionId]);
  
  // This is a tracking component only - it doesn't render anything
  return null;
};

export default AffiliateTracker;