# Google Cloud Integration Checklist

## Quick Start Integration

### 1. Update Environment Variables

Add to `/apps/web/.env.local`:
```bash
# Google APIs (Required)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...  # Your restricted public key
GOOGLE_PLACES_API_KEY=AIza...            # Your server-side key

# Google Analytics (Required)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# GSC (For SEO features)
GSC_SITE_URL=https://menshealthfinder.com
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
```

### 2. Files to Update

#### A. Google Maps Integration
- [ ] `/apps/web/pages/_document.tsx` - Add Maps script
- [ ] `/apps/web/components/Map.tsx` - Update API key reference
- [ ] `/apps/web/components/discovery/DiscoveryMap.tsx` - Update API key

#### B. Places API Integration  
- [ ] `/apps/web/utils/discovery/dataCollectors.ts` - Replace mock key with real key
- [ ] `/apps/web/utils/discovery/discoveryOrchestrator.ts` - Verify error handling

#### C. Analytics Integration
- [ ] `/apps/web/pages/_app.tsx` - Add GA4 tracking code
- [ ] `/apps/web/utils/analytics.ts` - Update tracking functions

#### D. GSC Integration
- [ ] `/apps/worker/utils/gscClient.ts` - Add service account auth
- [ ] `/apps/worker/tasks/runSeoIndexAudit.ts` - Update GSC API calls

### 3. Service Account Setup

1. Download service account JSON from GCP Console
2. Save as `service-account-key.json` in project root
3. Add to `.gitignore`:
```
service-account-key.json
*.json
!package.json
!tsconfig.json
```

### 4. Update Discovery Tool

In `/apps/web/utils/discovery/dataCollectors.ts`, change:

```typescript
// FROM:
const GOOGLE_API_KEY = 'MOCK_API_KEY_FOR_TESTING';

// TO:
const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

if (!GOOGLE_API_KEY) {
  throw new Error('GOOGLE_PLACES_API_KEY is not set');
}
```

### 5. Add Error Handling

Create `/apps/web/utils/googleApiErrors.ts`:

```typescript
export function handleGoogleApiError(error: any) {
  if (error.response?.data?.error?.code) {
    const code = error.response.data.error.code;
    const message = error.response.data.error.message;
    
    switch (code) {
      case 'REQUEST_DENIED':
        console.error('API Key issue:', message);
        break;
      case 'OVER_QUERY_LIMIT':
        console.error('Quota exceeded:', message);
        break;
      case 'INVALID_REQUEST':
        console.error('Invalid request:', message);
        break;
      default:
        console.error('Google API Error:', code, message);
    }
  }
  
  throw error;
}
```

### 6. Test Your Integration

Run these commands to test:

```bash
# Test environment variables are loaded
cd apps/web
npm run dev

# Open browser console and check:
# - Google Maps loads without errors
# - No API key warnings
# - Analytics events fire

# Test discovery tool
# Navigate to /admin/discovery
# Try a search - it should return real results
```

### 7. Production Deployment

Before deploying:

1. **Vercel Environment Variables**:
   - Add all env vars to Vercel dashboard
   - Use production API keys (not dev keys)

2. **Domain Verification**:
   - Verify domain in Google Search Console
   - Add production domain to API key restrictions

3. **Monitoring**:
   - Set up GCP billing alerts
   - Monitor API usage daily for first week

### 8. Cost Controls

Add to `/apps/web/utils/rateLimiter.ts`:

```typescript
// Simple in-memory rate limiter
const requestCounts = new Map();
const RATE_LIMIT = 100; // requests per hour
const WINDOW = 60 * 60 * 1000; // 1 hour

export function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(identifier) || [];
  
  // Remove old requests
  const recentRequests = userRequests.filter(
    (time: number) => now - time < WINDOW
  );
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false; // Rate limit exceeded
  }
  
  recentRequests.push(now);
  requestCounts.set(identifier, recentRequests);
  return true;
}
```

## Common Integration Issues

### Issue: "This API key is not authorized"
**Fix**: Check API key restrictions in GCP Console

### Issue: "Quota exceeded" 
**Fix**: Enable billing in GCP or increase quotas

### Issue: Maps not showing
**Fix**: Check browser console, ensure Maps script loads before components

### Issue: No analytics data
**Fix**: Wait 24-48 hours, check GA4 real-time view first

## Ready to Deploy?

Once all items are checked:
1. Test thoroughly in development
2. Deploy to staging/preview first
3. Monitor API usage closely
4. Gradually increase usage limits

Remember: Start with conservative API quotas and increase as needed!