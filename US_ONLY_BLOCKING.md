# Implementing US-Only Access for Men's Health Finder

## Why Block Non-US Traffic?

### Benefits ✅
1. **Save API costs** - Don't waste Google Places API calls
2. **Better performance** - Less server load
3. **Cleaner analytics** - Only track relevant users
4. **No irrelevant searches** - Avoid "testosterone clinic in London" searches
5. **Legal clarity** - US healthcare regulations only

### Potential Negatives ⚠️
1. **US travelers abroad** - Blocked while traveling
2. **VPN users** - May appear as foreign
3. **SEO impact** - Minor, but Google crawlers worldwide
4. **Military bases** - Some overseas IPs

## Implementation Options

### Option 1: Middleware Blocking (Recommended)
Block at the edge before they even hit your app:

```typescript
// middleware.ts (Next.js 12+)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Allow API routes and static assets
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get country from IP
  const ip = request.ip || request.headers.get('x-forwarded-for') || '';
  
  try {
    // Quick country check (using ip-api.com)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    const data = await response.json();
    
    if (data.countryCode && data.countryCode !== 'US') {
      // Redirect to a nice "US Only" page
      return NextResponse.redirect(new URL('/us-only', request.url));
    }
  } catch (error) {
    // If detection fails, allow access (fail open)
    console.error('Country detection failed:', error);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next (Next.js internals)
     * - static files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

### Option 2: Cloudflare Firewall Rules (Best Performance)
If using Cloudflare, block at CDN level:

```
# Cloudflare Firewall Rule
(ip.geoip.country ne "US") 
Action: Block (or redirect to /us-only)
```

Benefits:
- Blocks before hitting your server
- Saves bandwidth
- Free with Cloudflare

### Option 3: API Route Protection
Protect expensive API calls:

```typescript
// pages/api/search-clinics.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Check country first
  const country = await getCountryFromIP(req);
  
  if (country !== 'US') {
    return res.status(403).json({ 
      error: 'Service only available in the United States',
      country: country 
    });
  }
  
  // Proceed with expensive Google Places API call
  const results = await searchClinics(req.body);
  res.json(results);
}

// utils/getCountryFromIP.ts
export async function getCountryFromIP(req: NextApiRequest): Promise<string> {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
             req.socket.remoteAddress || '';
  
  // Cache country lookups
  const cached = countryCache.get(ip);
  if (cached) return cached;
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`);
    const data = await response.json();
    const country = data.countryCode || 'UNKNOWN';
    
    countryCache.set(ip, country);
    return country;
  } catch (error) {
    return 'UNKNOWN'; // Fail open
  }
}
```

### Option 4: Smart US-Only Page
Create a helpful page for non-US visitors:

```typescript
// pages/us-only.tsx
export default function USOnlyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md mx-auto text-center p-8">
        <img src="/us-flag.svg" className="w-20 h-20 mx-auto mb-6" />
        <h1 className="text-3xl font-bold mb-4">
          Men's Health Finder is Currently US-Only
        </h1>
        <p className="text-gray-600 mb-6">
          We exclusively serve men's health clinics in the United States. 
          Our directory and services are tailored specifically for the US healthcare system.
        </p>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Traveling to the US?</h3>
            <p className="text-sm text-gray-600">
              Bookmark us for when you arrive! We'll detect your US location automatically.
            </p>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Using a VPN?</h3>
            <p className="text-sm text-gray-600">
              Please connect to a US server to access our services.
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-sm text-gray-500">
          Detected location: {/* Show their country */}
        </p>
      </div>
    </div>
  );
}
```

## Implementation Strategy

### Phase 1: Soft Block (Recommended Start)
```typescript
// Just hide non-US results, don't block access
export default function HomePage() {
  const { country } = useGeoLocation();
  
  if (country && country !== 'US') {
    return <USOnlyNotice />;
  }
  
  return <FullHomePage />;
}
```

### Phase 2: API Protection
```typescript
// Block expensive operations
if (country !== 'US') {
  return res.status(403).json({ 
    error: 'US only',
    message: 'Please use a US IP address'
  });
}
```

### Phase 3: Edge Blocking
Implement middleware or Cloudflare rules for full blocking.

## Handling Edge Cases

### 1. US Military/Government Overseas
```typescript
const US_MILITARY_COUNTRIES = ['DE', 'JP', 'KR', 'IT', 'GB']; // Common base locations

if (country === 'US' || US_MILITARY_COUNTRIES.includes(country)) {
  // Allow with verification
  showMilitaryVerification();
}
```

### 2. Search Engine Crawlers
```typescript
// Always allow search engines
const isBot = /bot|crawler|spider|google|bing/i.test(req.headers['user-agent']);
if (isBot) {
  return NextResponse.next();
}
```

### 3. Development Mode
```typescript
// Don't block in development
if (process.env.NODE_ENV === 'development') {
  return NextResponse.next();
}
```

## Cost Savings Analysis

### Without Blocking:
- 10,000 daily visitors
- 30% international = 3,000 blocked
- Save ~90,000 API calls/month
- **Save ~$1,500/month in API costs**

### With Smart Caching:
```typescript
// Cache country for 24 hours
const countryCache = new LRUCache<string, string>({
  max: 10000,
  ttl: 1000 * 60 * 60 * 24
});

// Result: Only 1 country lookup per unique IP per day
```

## SEO Considerations

### Do Allow:
- Googlebot (all locations)
- Bingbot
- Other search crawlers
- Schema.org validators

### Robots.txt Addition:
```
# Inform crawlers about US focus
Sitemap: https://menshealthfinder.com/sitemap.xml
# US-focused medical directory
```

## Analytics Tracking

Track blocked users for insights:
```typescript
// Before blocking
analytics.track('blocked_user', {
  country: data.countryCode,
  timestamp: new Date(),
  referrer: req.headers.referer
});
```

## My Recommendation

1. **Start with API protection only** - Block expensive operations
2. **Add nice US-only page** - Good user experience
3. **Monitor analytics** - See how many users affected
4. **Implement edge blocking** - Once comfortable with impact

This approach saves significant API costs while being user-friendly!