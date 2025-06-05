# Review Collection Setup Guide

## Overview
The review collection system aggregates reviews from external sources (Google, Healthgrades) and stores them in Firestore. Reviews are collected during discovery, import, or manual updates.

## Prerequisites

1. **Google Cloud Console Access**
2. **Firebase Project Setup**
3. **Completed Google Places API Setup** (see GOOGLE_API_SETUP.md)

## Step 1: Enable Required Google APIs

In [Google Cloud Console](https://console.cloud.google.com/), enable:

1. **Places API** - For place details and reviews
2. **Maps JavaScript API** - For map features
3. **Geocoding API** - For address lookup

## Step 2: Configure Environment Variables

### Web App (`/apps/web/.env.local`)
```bash
# Google Maps API (same key as Places API)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your-key-here

# Firebase Configuration (from Firebase Console)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Worker (`/apps/worker/.env`)
```bash
# Google API Key (can be same as frontend)
GOOGLE_MAPS_API_KEY=AIza...your-key-here

# Firebase Admin SDK (from Firebase Console > Project Settings > Service Accounts)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...your-key...\n-----END PRIVATE KEY-----\n"

# Or use service account file
GOOGLE_APPLICATION_CREDENTIALS=./path/to/serviceAccountKey.json
```

## Step 3: Firestore Setup

### Create Indexes
Run in your project root:
```bash
firebase deploy --only firestore:indexes
```

Or manually create these composite indexes in Firebase Console:

1. **clinics collection**:
   - `googlePlacesId` (Ascending) + `lastReviewUpdate` (Ascending)
   - `status` (Ascending) + `lastReviewUpdate` (Ascending)

2. **reviews subcollection**:
   - `source` (Ascending) + `rating` (Descending)
   - `created` (Descending)

### Security Rules
Update `firestore.rules`:
```javascript
// Reviews subcollection
match /clinics/{clinicId}/reviews/{reviewId} {
  allow read: if true;
  allow write: if request.auth != null && 
    request.auth.token.admin == true;
}
```

## Step 4: Prepare Clinics for Review Collection

Clinics need a `googlePlacesId` to fetch Google reviews:

### Option A: During Import
Include `googlePlacesId` in your CSV/JSON:
```csv
name,address,city,state,phone,googlePlacesId
"Austin Men's Health","123 Main St","Austin","TX","(512) 555-0123","ChIJxxxxxxxxxxxxxx"
```

### Option B: During Discovery
The discovery process automatically captures Google Place IDs when finding clinics.

### Option C: Manual Update
Use the admin panel to add Google Place IDs to existing clinics.

## Step 5: Test Review Collection

### Test with Single Clinic
```bash
# Get a clinic ID from Firestore
npm run worker review-update --clinic-ids CLINIC_ID_HERE --max-reviews 5
```

### Test with Discovery Session
```bash
# After running discovery
npm run worker review-update --discovery-session SESSION_ID_HERE
```

### Test via Web UI
1. Go to `/admin/discovery`
2. Run a discovery session
3. Check "Import Google Reviews" option
4. Reviews will be fetched automatically

## Step 6: Monitor Review Collection

### Check Logs
```bash
# Worker logs
npm run worker review-update --clinic-ids CLINIC_ID --enable-logging

# Check Firestore
# Look in: clinics/{clinicId}/reviews/
```

### Verify in Admin Panel
1. Go to `/admin/clinic/[id]`
2. Check the "Reviews" section
3. Verify external reviews are displayed

## Step 7: Schedule Regular Updates

### Option A: Cloud Scheduler (Recommended)
```bash
# Create a Cloud Function that calls the review update
# Schedule it to run weekly/monthly
```

### Option B: Manual Updates
```bash
# Update all clinics (be careful with API costs!)
npm run worker review-update --all --batch-size 10
```

## API Costs & Limits

### Google Places API Pricing
- **Place Details (Basic)**: Free
- **Place Details (Contact)**: $17/1000 requests
- **Place Details (Atmosphere)**: $25/1000 requests
- **Reviews are part of Basic Data**: FREE! 🎉

### Rate Limits
- Default: 1 request per second (1000ms delay)
- Adjust with `--rate-limit` flag
- Google allows up to 6,000 QPM (queries per minute)

## Troubleshooting

### No Reviews Found
1. **Check Google Place ID**: 
   - Verify the ID is correct
   - Use Google Places API Explorer to test
   
2. **Check API Response**:
   ```javascript
   // Add logging to reviewAggregator.js
   console.log('API Response:', JSON.stringify(data, null, 2));
   ```

3. **Verify Permissions**:
   - Ensure API key has Places API enabled
   - Check quotas in Google Cloud Console

### Reviews Not Displaying
1. Check Firestore subcollection: `clinics/{clinicId}/reviews`
2. Verify review source is 'google' (not 'Google')
3. Check ReviewsSection.tsx filtering logic

### API Errors
- **INVALID_REQUEST**: Check Place ID format
- **OVER_QUERY_LIMIT**: Reduce rate or upgrade billing
- **REQUEST_DENIED**: API key issue or API not enabled

## Best Practices

1. **Cache Reviews**: Don't fetch reviews on every page load
2. **Update Schedule**: Weekly or monthly is usually sufficient
3. **Batch Processing**: Process 10-50 clinics at a time
4. **Error Handling**: Log failed clinics for retry
5. **Monitor Costs**: Set up billing alerts in Google Cloud

## Next Steps

1. **Remove Yelp References**: Clean up deprecated Yelp code
2. **Add Review Moderation**: Flag inappropriate reviews
3. **Implement Review Responses**: For premium tier clinics
4. **Add Review Analytics**: Track review trends
5. **Set Up Alerts**: Notify clinics of new reviews

## Sample Review Object

```json
{
  "id": "google_John_Doe_abc123",
  "source": "google",
  "author": "John Doe",
  "authorUrl": "https://www.google.com/maps/contrib/123456789",
  "rating": 5,
  "text": "Great service and professional staff!",
  "date": "2024-01-15",
  "url": "https://goo.gl/maps/xxxxx",
  "verified": true,
  "created": "2024-01-20T10:30:00Z",
  "updated": "2024-01-20T10:30:00Z"
}
```