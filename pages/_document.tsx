import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Structured data for organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: "Men's Health Finder",
              url: 'https://menshealthfinder.com',
              logo: 'https://menshealthfinder.com/logo.png',
              sameAs: [
                'https://twitter.com/menshealthfndr',
                'https://www.facebook.com/menshealthfinder',
                'https://www.linkedin.com/company/mens-health-finder'
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                telephone: '+1-800-123-4567',
                contactType: 'customer service',
                areaServed: 'US',
                availableLanguage: 'English'
              },
              description: "Men's Health Finder helps men locate specialized healthcare providers and clinics that address their unique health concerns."
            })
          }}
        />
        
        {/* Default SEO meta tags - will be overridden on each page */}
        <meta 
          name="description" 
          content="Find men's health clinics near you. Locate clinics specializing in men's health, TRT, ED treatment, weight loss, and more."
        />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Robots.txt meta tag - enhanced for SEO */}
        <meta 
          name="robots" 
          content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" 
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}