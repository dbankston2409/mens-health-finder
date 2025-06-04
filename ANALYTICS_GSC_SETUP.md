# Analytics & Search Console Setup Guide

## Prerequisites Before Importing Clinics

### 1. Google Analytics 4 (GA4) Setup ✅ Already Configured

**Current Implementation:**
- GA4 tracking code already in `_app.tsx`
- Analytics library in `/lib/analytics.ts`
- Environment variable: `NEXT_PUBLIC_GA_MEASUREMENT_ID`

**To Complete Setup:**
1. Get your GA4 Measurement ID from Google Analytics
2. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

**Events Being Tracked:**
- Page views (automatic)
- Clinic imports
- Discovery sessions
- Clinic profile views
- Affiliate clicks

### 2. Google Search Console Setup 🔧 Required

**Step 1: Add Property**
```
1. Go to: https://search.google.com/search-console
2. Click "Add property"
3. Choose "Domain" (recommended) or "URL prefix"
4. Enter your domain: yourdomain.com
```

**Step 2: Verify Ownership**
```
Option A - DNS Verification (Recommended):
1. Copy the TXT record provided
2. Add to your DNS provider
3. Format: TXT record @ "google-site-verification=xxxxx"

Option B - HTML File:
1. Download verification file
2. Upload to: /public/google[hash].html
3. Verify access: yourdomain.com/google[hash].html
```

**Step 3: Configure GSC**
```
1. Submit Sitemap:
   - URL: https://yourdomain.com/sitemap.xml
   - Will auto-update with new clinics

2. URL Inspection:
   - Test individual clinic pages
   - Check indexing status

3. Performance Reports:
   - Monitor search queries
   - Track click-through rates
   - Identify top-performing clinics
```

### 3. Sitemap Configuration 📍

**Current Implementation:**
The sitemap generator is already built at:
- `/apps/web/scripts/generateSitemap.js`
- API endpoint: `/api/sitemap/generate.ts`

**Auto-generated URLs include:**
- Static pages (home, about, contact, etc.)
- All clinic profile pages
- Category pages
- City/state landing pages
- Online provider pages

**To Enable:**
1. The sitemap auto-generates when accessed
2. Submit to GSC: https://yourdomain.com/sitemap.xml

### 4. Structured Data for Rich Results 🌟

**Already Implemented:**
- Organization schema
- LocalBusiness schema for clinics
- BreadcrumbList schema
- Review aggregate ratings

**Benefits:**
- Rich snippets in search results
- Star ratings display
- Business info cards
- Enhanced local search presence

### 5. Tracking Import Success 📊

**What Gets Tracked:**
```javascript
// When importing clinics
trackClinicImport('discovery_session_123', 500);

// When discovery completes
trackDiscoverySession('completed', 500);

// When users view clinics
trackClinicView('clinic_id', 'free');
```

**GA4 Reports to Monitor:**
- **Realtime**: See imports as they happen
- **Engagement > Pages**: Track which clinics get views
- **Acquisition**: See how users find your clinics
- **Monetization**: Track affiliate conversions

### 6. Pre-Import Checklist ✅

Before running discovery/import:

- [ ] GA4 Measurement ID configured in `.env.local`
- [ ] Google Search Console verified and configured
- [ ] Sitemap submitted to GSC
- [ ] Test tracking with GA4 DebugView
- [ ] Verify structured data with Rich Results Test
- [ ] Set up GSC email alerts for issues
- [ ] Configure GA4 custom events dashboard

### 7. Database Optimization Recommendations 🚀

**Instead of storing 97+ fields per clinic, optimize to ~25 essential fields:**

**Remove/Don't Import:**
- Duplicate rating fields (keep only aggregates)
- Full photo arrays (store only URLs or flags)
- Redundant timestamp fields
- Legacy package/tier fields
- Yelp-related fields (being removed)
- Detailed accessibility sub-objects (fetch on-demand)

**Keep Essential:**
- Core business info (name, address, phone, website)
- Single tier field
- Google Places ID
- Aggregate ratings
- Key service flags
- Single SEO description
- Discovery metadata

**Storage Strategy:**
1. **Basic Import**: Store only essential fields
2. **On-Demand Enhancement**: Fetch rich data when needed
3. **Cache Strategy**: Use CDN for photos, not Firestore
4. **Periodic Cleanup**: Remove unused legacy fields

### 8. Post-Import Monitoring 📈

**Week 1:**
- Monitor indexing rate in GSC
- Check for crawl errors
- Verify structured data
- Track initial traffic

**Week 2-4:**
- Analyze search queries
- Identify high-performing clinics
- Monitor page experience metrics
- Track conversion funnels

**Monthly:**
- Review GA4 retention reports
- Analyze user journeys
- Optimize based on data
- A/B test clinic pages

### 9. Troubleshooting Common Issues 🔧

**Clinics Not Indexing:**
- Check robots.txt
- Verify sitemap submission
- Test with URL Inspector
- Check for noindex tags

**Low Traffic:**
- Review page titles/descriptions
- Check Core Web Vitals
- Analyze search queries
- Improve content quality

**Tracking Issues:**
- Use GA4 DebugView
- Check browser console
- Verify measurement ID
- Test in incognito mode

## Environment Variables Summary

Add to `.env.local`:
```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Already configured
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
GOOGLE_MAPS_API_KEY=...
```

## Ready to Import! 🎉

Once GA4 and GSC are configured, your imports will be automatically tracked and indexed!