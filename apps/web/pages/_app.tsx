import '@/styles/globals.css';
import '@/styles/map.css';
import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Script from 'next/script';
import Layout from '@/components/Layout';
import { AuthProvider } from '@/lib/contexts/authContext';
import { initAnalytics, trackPageView, exposeAnalytics } from '../../../lib/analytics';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Initialize and track GA4 page views
  useEffect(() => {
    // Initialize analytics
    initAnalytics();
    
    // Expose analytics for debugging in development
    if (process.env.NODE_ENV === 'development') {
      exposeAnalytics();
    }
    
    // Track page view on initial load
    trackPageView(router.pathname);
    
    // Track page views on route changes
    const handleRouteChange = (url: string) => {
      trackPageView(url);
    };
    
    router.events.on('routeChangeComplete', handleRouteChange);
    
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);
  
  return (
    <AuthProvider>
      {/* Google Analytics script */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
      />
      
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AuthProvider>
  );
}