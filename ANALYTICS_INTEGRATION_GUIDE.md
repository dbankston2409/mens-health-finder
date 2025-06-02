# 📊 Google Analytics & Search Console Integration Guide

## Current Status

### ✅ Google Analytics (GA4) - 80% Complete
- **Frontend tracking implemented** with custom events
- **Page view tracking** working
- **Custom events** for clinic views, phone clicks, website clicks
- **Attribution tracking** via UTM parameters
- **Missing**: GA4 Measurement ID in environment

### 🟡 Google Search Console - 40% Complete
- **GSC Client built** but using mock data
- **Sitemap generation** ready
- **Index monitoring** scaffolded
- **Missing**: GSC API credentials and setup

---

## 🔧 What Needs to Be Done

### 1. Google Analytics Setup (30 minutes)

#### Create GA4 Property
1. Go to [Google Analytics](https://analytics.google.com)
2. Create new property: "Men's Health Finder"
3. Set up data stream for web
4. Get Measurement ID (format: G-XXXXXXXXXX)

#### Configure Environment
```bash
# Add to apps/web/.env.local
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Verify Implementation
- Deploy changes
- Visit site with GA DebugView enabled
- Confirm events firing:
  - `page_view`
  - `clinic_view`
  - `click_to_call`
  - `click_to_website`
  - `search`

---

### 2. Google Search Console Setup (1 hour)

#### Verify Domain Ownership
1. Go to [Search Console](https://search.google.com/search-console)
2. Add property: `menshealthfinder.com`
3. Verify via DNS TXT record or HTML file
4. Add all variations:
   - `https://menshealthfinder.com`
   - `https://www.menshealthfinder.com`
   - `http://menshealthfinder.com`
   - `http://www.menshealthfinder.com`

#### Enable API Access
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or use existing
3. Enable APIs:
   - Search Console API
   - Indexing API
4. Create Service Account:
   - Name: `mhf-search-console`
   - Download JSON key file
5. Add service account email to Search Console as owner

#### Configure Worker Environment
```bash
# Add to apps/worker/.env
GSC_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com
GSC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
GSC_SITE_URL=https://menshealthfinder.com
```

#### Submit Sitemap
```bash
# Sitemap will be at:
https://menshealthfinder.com/sitemap.xml

# Submit in Search Console UI
```

---

## 📈 Analytics Events Reference

### Page Events
```javascript
// Automatic on every page
trackPageView(path, title)
```

### Clinic Events
```javascript
// When viewing clinic profile
trackClinicView(clinicId, clinicSlug, clinicName)

// When clicking phone number
trackClickToCall(clinicId, clinicName, phoneNumber)

// When clicking website link
trackClickToWebsite(clinicId, clinicName, websiteUrl)

// When clicking directions
trackClickToDirections(clinicId, clinicName, address)
```

### Search Events
```javascript
// When searching
trackSearch(query, resultCount, filters)
```

### Lead Events (to implement)
```javascript
// When submitting lead form
trackLeadSubmission(clinicId, leadType)

// When submitting review
trackReviewSubmission(clinicId, rating)
```

---

## 🔍 Search Console Features

### Currently Implemented
- **Sitemap generation** at `/api/sitemap/generate`
- **Index status checking** in worker
- **GSC ping on updates**
- **Mock data for development**

### After Integration
- **Real index status** for all clinics
- **Search performance data**:
  - Keywords driving traffic
  - Click-through rates
  - Average positions
- **Crawl error monitoring**
- **Automatic reindexing requests**

---

## 📊 Dashboard Integration

### Admin Analytics Panel (`/admin`)
Currently shows:
- Traffic overview (mock data)
- Top performing clinics
- Search visibility metrics
- Engagement scores

After integration will show:
- Real GA4 data
- Actual search queries from GSC
- True click-through rates
- Indexing status per clinic

### Clinic Reports (`/admin/reports/[clinicId]`)
Currently includes:
- Mock traffic data
- Estimated metrics

After integration will include:
- Real traffic from GA4
- Search keywords from GSC
- Accurate conversion tracking
- Month-over-month comparisons

---

## 🚀 Implementation Steps

### Phase 1: Google Analytics (Today)
1. [ ] Create GA4 property
2. [ ] Add measurement ID to environment
3. [ ] Deploy and verify tracking
4. [ ] Set up conversion goals
5. [ ] Configure audiences

### Phase 2: Search Console (Tomorrow)
1. [ ] Verify domain ownership
2. [ ] Enable APIs in Google Cloud
3. [ ] Create service account
4. [ ] Add credentials to worker
5. [ ] Submit sitemap
6. [ ] Test API integration

### Phase 3: Enhanced Tracking (This Week)
1. [ ] Add lead form tracking
2. [ ] Implement e-commerce tracking for upgrades
3. [ ] Set up custom dimensions:
   - Clinic tier
   - User type (visitor/admin/clinic)
   - Location
4. [ ] Create custom reports
5. [ ] Set up alerts

---

## 📱 Testing Analytics

### Browser Tools
- [GA Debugger Chrome Extension](https://chrome.google.com/webstore/detail/google-analytics-debugger)
- GA4 DebugView in Analytics
- Browser DevTools Network tab

### Test Scenarios
1. **Page Navigation**
   - Visit homepage → clinic page → search
   - Verify page_view events

2. **Clinic Interactions**
   - Click phone number
   - Click website
   - Click directions
   - Verify all events fire

3. **Search Flow**
   - Search for "testosterone"
   - Click result
   - Verify search event + clinic view

### Debug Commands
```javascript
// In browser console
window.MHF.analytics.trackClinicView('test-id', 'test-slug', 'Test Clinic')
window.MHF.analytics.getAttributionParams()
```

---

## 🔧 Troubleshooting

### GA4 Not Tracking
- Check measurement ID is set
- Verify gtag script loads
- Check browser ad blockers
- Use GA Debugger extension

### GSC API Errors
- Verify service account permissions
- Check API quotas
- Ensure domain is verified
- Test with GSC API Explorer

### Missing Data
- Allow 24-48 hours for data
- Check date ranges
- Verify filters
- Check sampling settings

---

## 📈 Success Metrics

After full integration, you'll track:
- **Acquisition**: Where users come from
- **Behavior**: How they navigate
- **Conversions**: Phone calls, form fills
- **Search Performance**: Keywords, CTR
- **Technical Health**: Index coverage, crawl errors

This data will drive:
- SEO optimization decisions
- Content strategy
- Tier upgrade targeting
- Marketing campaign ROI
- Technical improvements