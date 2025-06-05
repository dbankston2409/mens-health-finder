# Worker Service Deployment Guide

## Prerequisites
1. Render account with worker capabilities
2. Firebase service account credentials
3. API keys (OpenAI/Claude, Geocoding)

## Step 1: Deploy Worker to Render

### Via Render Dashboard:
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Worker"
3. Connect your GitHub repo
4. Select branch: `main`
5. Root Directory: `apps/worker`
6. Build Command: `npm install && npm run build`
7. Start Command: `npm start`

### Via render.yaml (Recommended):
1. In your repo root, run:
   ```bash
   render-cli deploy
   ```
2. Or push to GitHub and Render will auto-deploy

## Step 2: Set Environment Variables

In Render Dashboard → Worker → Environment:

```bash
# Firebase (Required)
FIREBASE_PROJECT_ID=mens-health-finder-825e0
FIREBASE_CLIENT_EMAIL=<from-service-account-json>
FIREBASE_PRIVATE_KEY=<from-service-account-json>

# AI Services (Required for content generation)
OPENAI_API_KEY=<your-openai-key>
CLAUDE_API_KEY=<your-claude-key>

# Google Services (Required)
GEOCODE_API_KEY=<your-google-maps-key>
GSC_CLIENT_EMAIL=<from-gsc-service-account>
GSC_PRIVATE_KEY=<from-gsc-service-account>
GSC_SITE_URL=https://menshealthfinder.com

# Optional
NEXT_PUBLIC_SITE_URL=https://menshealthfinder.com
```

## Step 3: Verify Deployment

1. Check Render logs for "Worker started successfully"
2. Monitor for any connection errors
3. Test by importing a clinic via admin panel

## Step 4: Scheduled Jobs

The render.yaml includes cron jobs for:
- Daily imports (2 AM)
- Analytics processing (every 6 hours)
- SEO refresh (4 AM daily)
- Weekly reports (Monday 9 AM)

These will start automatically once deployed.

## Troubleshooting

### Common Issues:
1. **Firebase connection failed**: Check service account credentials
2. **No API keys**: Worker needs AI keys for content generation
3. **Memory issues**: Upgrade to Starter Plus if needed

### Logs:
```bash
# View live logs
render logs --service mhf-worker --tail
```

## Success Indicators
- ✅ Worker shows "Connected to Firebase"
- ✅ Import jobs process successfully
- ✅ SEO content generates
- ✅ Scheduled tasks run on time