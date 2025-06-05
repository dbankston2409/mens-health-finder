# Google Places API Setup Guide

## Overview
The discovery system requires a Google Places API key to search for clinics and retrieve business information.

## Step 1: Get a Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable these APIs:
   - Places API
   - Maps JavaScript API (for map display)
   - Geocoding API (for address conversion)
4. Create credentials → API Key
5. Restrict the API key:
   - For frontend: Add HTTP referrer restrictions (your domain)
   - For backend: Add IP restrictions or leave unrestricted for development

## Step 2: Configure Environment Variables

### Frontend (Web App)
Add to `/apps/web/.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=AIza...your-key-here
```

This is used by:
- Discovery orchestrator in the browser
- Map components
- Location search features

### Backend (Worker) - Optional
If you want to run discovery from CLI, add to `/apps/worker/.env`:
```bash
GOOGLE_PLACES_API_KEY=AIza...your-key-here
```

## Step 3: Test the Configuration

### Test in Web App:
1. Start the web app: `npm run dev`
2. Go to `/admin/discovery`
3. Try starting a new discovery session
4. Check browser console for API errors

### Test in Worker:
1. Run: `npm run worker discovery --target 100 --strategy metro_first`
2. Check the output for session creation
3. Monitor with: `npm run worker discovery:monitor [session-id]`

## API Usage Costs

Google Places API pricing (as of 2024):
- Nearby Search: $32.00 per 1,000 requests
- Place Details: $17.00 per 1,000 requests
- Basic Data (no contact info): $0.00

**Cost Optimization Tips:**
1. Use Basic Data fields when possible (free)
2. Cache results in Firestore
3. Limit concurrent searches
4. Use smaller search radius
5. Filter results before fetching details

## Troubleshooting

### "API key not valid" error
- Check API key is correct
- Ensure Places API is enabled in Google Cloud Console
- Check API key restrictions

### "You have exceeded your daily request quota"
- Check Google Cloud Console for quota limits
- Consider upgrading billing account
- Reduce `maxConcurrentSearches` in discovery config

### No results returned
- Verify search area has businesses
- Check search keywords match business names
- Try broader search terms

## Security Notes

1. **Never commit API keys** to version control
2. Use different keys for production/development
3. Add domain restrictions for frontend keys
4. Monitor usage in Google Cloud Console
5. Set up billing alerts

## Next Steps

After configuration:
1. Test discovery with small target (100 clinics)
2. Monitor API usage and costs
3. Adjust search parameters based on results
4. Set up billing alerts in Google Cloud Console