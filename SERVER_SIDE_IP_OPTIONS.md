# Server-Side IP Geolocation Options

## Why You Need an IP Geolocation Service

**Next.js gives you the user's IP address**, but not their location:

```typescript
// Next.js API route
export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(ip); // "72.182.101.225" - Just numbers!
  
  // You need a service to convert IP → Location
  // IP address alone doesn't tell you the city
}
```

## Your Options (Free to Paid)

### Option 1: IPinfo.io (Popular Choice)
```typescript
// 50,000 requests/month free
const response = await fetch(`https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN}`);
```
- **Free tier**: 50k/month
- **Pros**: Accurate, reliable, good docs
- **Cons**: Need to sign up

### Option 2: ipapi.co (Simpler)
```typescript
// 1,000 requests/day free (30k/month)
const response = await fetch(`https://ipapi.co/${ip}/json/`);
// No API key needed for basic tier!
```
- **Free tier**: 30k/month
- **Pros**: No signup for basic use
- **Cons**: Lower limits

### Option 3: ip-api.com (No Key Needed)
```typescript
// 45 requests/minute free
const response = await fetch(`http://ip-api.com/json/${ip}`);
// Completely free, no key needed
```
- **Free tier**: Unlimited (rate limited)
- **Pros**: No signup at all
- **Cons**: HTTP only (not HTTPS) on free tier

### Option 4: Cloudflare (If Using CF)
```typescript
// If your site uses Cloudflare, it's FREE and automatic
export default async function handler(req, res) {
  // Cloudflare adds these headers for free
  const country = req.headers['cf-ipcountry'];     // "US"
  const region = req.headers['cf-region-code'];    // "TX"
  const city = req.headers['cf-city'];             // "Dallas"
  const lat = req.headers['cf-latitude'];          // "32.7767"
  const lng = req.headers['cf-longitude'];         // "-96.7970"
  
  res.json({ city, region, country, lat, lng });
}
```
- **Free tier**: Unlimited if using Cloudflare
- **Pros**: No extra API calls
- **Cons**: Must use Cloudflare CDN

### Option 5: MaxMind GeoLite2 (Self-Hosted)
```typescript
// Download free database, query locally
import maxmind from 'maxmind';

const lookup = await maxmind.open('/path/to/GeoLite2-City.mmdb');
const result = lookup.get(ip);
```
- **Free tier**: Unlimited
- **Pros**: No API calls, fully private
- **Cons**: Need to update database monthly

## Quick Start Recommendation

### For MVP/Getting Started:
Use **ip-api.com** - No signup needed:

```typescript
// pages/api/detect-location.ts
export default async function handler(req, res) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
             req.socket.remoteAddress || '';
  
  // Remove localhost check for production
  if (ip === '::1' || ip === '127.0.0.1') {
    return res.json({ 
      city: 'Dallas', 
      state: 'TX', 
      lat: 32.7767, 
      lng: -96.7970,
      local: true 
    });
  }
  
  try {
    // No API key needed!
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      res.json({
        city: data.city,
        state: data.regionName,
        lat: data.lat,
        lng: data.lon
      });
    } else {
      res.json({ error: 'Could not detect location' });
    }
  } catch (error) {
    res.json({ error: 'Location detection failed' });
  }
}
```

### For Production:
Use **IPinfo** with caching:

```typescript
// pages/api/detect-location.ts
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({ 
  max: 5000, 
  ttl: 1000 * 60 * 60 * 24 // 24 hours 
});

export default async function handler(req, res) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || 
             req.socket.remoteAddress || '';
  
  // Check cache first
  const cached = cache.get(ip);
  if (cached) {
    return res.json(cached);
  }
  
  try {
    const response = await fetch(
      `https://ipinfo.io/${ip}/json?token=${process.env.IPINFO_TOKEN}`
    );
    const data = await response.json();
    
    const location = {
      city: data.city,
      state: data.region,
      lat: parseFloat(data.loc.split(',')[0]),
      lng: parseFloat(data.loc.split(',')[1])
    };
    
    // Cache it
    cache.set(ip, location);
    
    // Also tell browser to cache
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.json(location);
    
  } catch (error) {
    res.status(500).json({ error: 'Location detection failed' });
  }
}
```

## Cost Comparison for 10k Daily Visitors

| Service | Monthly Requests | Monthly Cost | Setup Time |
|---------|-----------------|--------------|------------|
| ip-api.com | 300k | $0 | 0 min |
| ipapi.co | 300k | $0* | 0 min |
| IPinfo | 300k | $249 | 5 min |
| Cloudflare | Unlimited | $0** | 30 min |
| MaxMind | Unlimited | $0 | 60 min |

*Would need paid plan  
**If already using Cloudflare

## The Bottom Line

**You need SOME service** because:
- IP address (72.182.101.225) doesn't tell you "Dallas, TX"
- These services maintain massive databases mapping IPs to locations
- They update daily as IPs change

**For starting out**: Use ip-api.com (no signup)  
**For production**: Use IPinfo with caching (reliable, good free tier)  
**If using Cloudflare**: It's built-in free!

The server-side approach just means the API call happens on YOUR server instead of the user's browser, keeping your API keys secret.