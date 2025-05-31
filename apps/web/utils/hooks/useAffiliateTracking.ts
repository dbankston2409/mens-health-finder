import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Cookies from 'js-cookie';
import { v4 as uuidv4 } from 'uuid';
import { trackReferralClick } from '../../../lib/api/affiliateService';

// Constants
const AFFILIATE_COOKIE_NAME = 'mhf_affiliate';
const AFFILIATE_SESSION_NAME = 'mhf_affiliate_session';
const AFFILIATE_COOKIE_DAYS = 30; // Store affiliate attribution for 30 days

export function useAffiliateTracking() {
  const router = useRouter();
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Check for affiliate code in URL and set cookie if found
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    const handleAffiliateTracking = async () => {
      try {
        setIsProcessing(true);
        
        // Generate or retrieve a session ID
        let session = sessionStorage.getItem(AFFILIATE_SESSION_NAME);
        if (!session) {
          session = uuidv4();
          sessionStorage.setItem(AFFILIATE_SESSION_NAME, session);
        }
        setSessionId(session);
        
        // Check for 'ref' or 'affiliate' parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref') || urlParams.get('affiliate');
        
        if (refCode) {
          // Store in cookie for attribution
          Cookies.set(AFFILIATE_COOKIE_NAME, refCode, { expires: AFFILIATE_COOKIE_DAYS });
          setAffiliateCode(refCode);
          
          // Track the referral click in Firestore
          const targetUrl = window.location.href;
          let targetType: 'clinic' | 'signup' | 'blog' | 'homepage' = 'homepage';
          let targetId: string | undefined = undefined;
          
          // Determine target type and ID based on the current route
          const path = router.asPath.split('?')[0]; // Remove query params
          
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
          ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(param => {
            const value = urlParams.get(param);
            if (value) {
              utmParams[param] = value;
            }
          });
          
          // Track the referral in Firestore
          await trackReferralClick(
            refCode,
            targetUrl,
            targetType,
            targetId,
            {
              sessionId: session,
              utmParams
            }
          );
          
          console.debug(`[Affiliate] Tracked referral from affiliate: ${refCode}`);
        } else {
          // Check if there's an existing affiliate cookie for attribution
          const storedAffiliateCode = Cookies.get(AFFILIATE_COOKIE_NAME);
          if (storedAffiliateCode) {
            setAffiliateCode(storedAffiliateCode);
          }
        }
      } catch (error) {
        console.error('Error processing affiliate tracking:', error);
      } finally {
        setIsProcessing(false);
      }
    };
    
    handleAffiliateTracking();
  }, [router.asPath]);
  
  // Return affiliate info for other components to use
  return {
    affiliateCode,
    isAffiliate: !!affiliateCode,
    sessionId,
    isProcessing
  };
}

export default useAffiliateTracking;