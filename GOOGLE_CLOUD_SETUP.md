# Google Cloud Setup Guide for Men's Health Finder

## Overview
This guide covers setting up all necessary Google Cloud services for the Men's Health Finder system, including Google Places API for business discovery, Google Maps for location services, and Google Search Console for SEO.

## Required Google Cloud Services

### 1. Google Cloud Platform (GCP) Setup

#### A. Create GCP Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" → "New Project"
3. Project name: `mens-health-finder` (or your preference)
4. Note your Project ID (you'll need this)
5. Click "Create"

#### B. Enable Billing
1. Go to Navigation Menu → Billing
2. Link a billing account or create a new one
3. Set up billing alerts:
   - Navigation Menu → Billing → Budgets & alerts
   - Create budget with alerts at 50%, 90%, and 100%

### 2. Enable Required APIs

Navigate to "APIs & Services" → "Library" and enable:

#### A. Google Places API (New)
- **Purpose**: Business discovery, place details, reviews
- **Cost**: ~$17 per 1,000 requests for Place Details
- Enable: "Places API (New)"

#### B. Google Maps JavaScript API
- **Purpose**: Display maps on website
- **Cost**: $7 per 1,000 map loads
- Enable: "Maps JavaScript API"

#### C. Geocoding API
- **Purpose**: Convert addresses to coordinates
- **Cost**: $5 per 1,000 requests
- Enable: "Geocoding API"

### 3. Create API Credentials

#### A. Create API Key
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API Key"
3. Name it: `mens-health-finder-api-key`

#### B. Restrict API Key (IMPORTANT!)
1. Click on your API key
2. Under "Application restrictions":
   - Choose "HTTP referrers"
   - Add allowed referrers:
     ```
     https://menshealthfinder.com/*
     https://www.menshealthfinder.com/*
     http://localhost:3000/*  (for development)
     ```
3. Under "API restrictions":
   - Select "Restrict key"
   - Check only:
     - Places API (New)
     - Maps JavaScript API
     - Geocoding API
4. Click "Save"

#### C. Create Server API Key (for backend)
1. Create another API key for server-side use
2. Name it: `mens-health-finder-server-key`
3. Under "Application restrictions":
   - Choose "IP addresses"
   - Add your server's IP address
4. Restrict to same APIs as above

### 4. Google Search Console Setup

#### A. Add Property
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property → URL prefix
3. Enter: `https://menshealthfinder.com`
4. Verify ownership (choose method):
   - HTML file upload
   - DNS TXT record
   - Google Analytics
   - HTML tag

#### B. Submit Sitemap
1. Go to Sitemaps in GSC
2. Add sitemap URL: `https://menshealthfinder.com/sitemap.xml`
3. Submit

#### C. Set Up GSC API Access
1. Go to Google Cloud Console
2. Enable "Google Search Console API"
3. Create service account:
   - IAM & Admin → Service Accounts
   - Create new service account
   - Name: `gsc-api-access`
   - Download JSON key file

### 5. Google Analytics 4 Setup

#### A. Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com)
2. Admin → Create Property
3. Property name: "Men's Health Finder"
4. Set up data stream for web
5. Get Measurement ID (G-XXXXXXXXXX)

#### B. Enable GA4 API
1. In Google Cloud Console
2. Enable "Google Analytics Data API"
3. Add service account permissions in GA4

## Integration Steps

### 1. Environment Variables

Create/update `.env.local` in your Next.js app:

```bash
# Google Maps & Places
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-public-api-key
GOOGLE_PLACES_API_KEY=your-server-api-key

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# For GSC API (worker tasks)
GOOGLE_APPLICATION_CREDENTIALS=./path-to-service-account-key.json
GSC_SITE_URL=https://menshealthfinder.com
```

### 2. Update Discovery Service

Update `/apps/web/utils/discovery/dataCollectors.ts`:

```typescript
// Replace the mock API key with your actual key
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Verify the key is loaded
if (!GOOGLE_API_KEY) {
  throw new Error('GOOGLE_PLACES_API_KEY is not set in environment variables');
}
```

### 3. Update Map Component

Update `/apps/web/components/Map.tsx`:

```typescript
// Add Google Maps script
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// In your _document.tsx or _app.tsx
<script
  src={`https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`}
  async
  defer
/>
```

### 4. Set Up Analytics

Update `/apps/web/pages/_app.tsx`:

```typescript
import Script from 'next/script';

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Add in your App component
<>
  <Script
    src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
    strategy="afterInteractive"
  />
  <Script id="google-analytics" strategy="afterInteractive">
    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_MEASUREMENT_ID}');
    `}
  </Script>
</>
```

### 5. GSC Integration for Worker

Update `/apps/worker/utils/gscClient.ts`:

```typescript
const { google } = require('googleapis');
const path = require('path');

// Initialize GSC client
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, '../service-account-key.json'),
  scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
});

const searchconsole = google.searchconsole({
  version: 'v1',
  auth: auth,
});

// Example: Get search analytics
export async function getSearchAnalytics(startDate: string, endDate: string) {
  const response = await searchconsole.searchanalytics.query({
    siteUrl: process.env.GSC_SITE_URL,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query', 'page'],
      rowLimit: 1000,
    },
  });
  
  return response.data;
}
```

## Cost Optimization Tips

### 1. Implement Caching
```typescript
// Cache place details for 24 hours
const placeCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

async function getPlaceDetailsWithCache(placeId: string) {
  const cached = placeCache.get(placeId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const details = await fetchPlaceDetails(placeId);
  placeCache.set(placeId, {
    data: details,
    timestamp: Date.now()
  });
  
  return details;
}
```

### 2. Batch Requests
- Use Places API Nearby Search instead of individual lookups
- Batch geocoding requests when possible

### 3. Monitor Usage
- Set up billing alerts
- Use GCP's usage reports
- Track API calls in your application

## Security Checklist

- [ ] API keys are restricted by referrer/IP
- [ ] Server keys are never exposed in client code
- [ ] Service account keys are in .gitignore
- [ ] Environment variables are properly set
- [ ] HTTPS is enforced on production
- [ ] API quotas are set to prevent abuse

## Monthly Budget Estimate

Based on typical usage:
- Google Places API: ~$100-200/month
- Google Maps: ~$50-100/month
- Geocoding: ~$25-50/month
- **Total: ~$175-350/month**

(Much less than the $600/month Yelp API!)

## Testing Your Setup

### 1. Test Places API
```bash
curl -X GET "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=33.5186,-117.1611&radius=16093&type=doctor&keyword=mens%20health&key=YOUR_API_KEY"
```

### 2. Test in Development
1. Start your dev server
2. Open browser console
3. Check for Google Maps loaded
4. Test discovery tool
5. Verify analytics events

## Troubleshooting

### Common Issues:
1. **"API key not valid"**: Check restrictions match your domain
2. **"Quota exceeded"**: Check billing is enabled
3. **"Request denied"**: Ensure API is enabled in GCP
4. **No map display**: Check browser console for errors

## Next Steps

1. Set up all services following this guide
2. Add your API keys to environment variables
3. Deploy and test in production
4. Monitor usage for the first week
5. Adjust quotas/alerts as needed

## Support Resources

- [Google Places API Docs](https://developers.google.com/maps/documentation/places/web-service)
- [Maps JavaScript API Docs](https://developers.google.com/maps/documentation/javascript)
- [Search Console API Docs](https://developers.google.com/webmaster-tools/search-console-api-original)
- [GA4 API Docs](https://developers.google.com/analytics/devguides/reporting/data/v1)