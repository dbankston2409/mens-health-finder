# Worker Service Deployment Guide

This guide covers deploying the Men's Health Finder worker service to various platforms.

## 🚀 Quick Deploy to Render

### 1. Prerequisites
- Render account (https://render.com)
- GitHub repository connected
- Firebase service account credentials

### 2. Deploy via Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Select the `apps/worker/render.yaml` blueprint
5. Configure environment variables:
   ```
   FIREBASE_PROJECT_ID=mens-health-finder-825e0
   FIREBASE_CLIENT_EMAIL=<your-service-account-email>
   FIREBASE_PRIVATE_KEY=<your-private-key>
   ```

### 3. Deploy via CLI
```bash
# Install Render CLI
brew install render

# Deploy
cd apps/worker
render blueprint launch
```

## 🚂 Deploy to Railway

### 1. Prerequisites
- Railway account (https://railway.app)
- Railway CLI installed

### 2. Deploy Steps
```bash
# Install Railway CLI
brew install railway

# Login
railway login

# Deploy from worker directory
cd apps/worker
railway up

# Set environment variables
railway variables set FIREBASE_PROJECT_ID=mens-health-finder-825e0
railway variables set FIREBASE_CLIENT_EMAIL=<your-email>
railway variables set FIREBASE_PRIVATE_KEY=<your-key>
```

## 🐳 Docker Deployment

### 1. Build Image
```bash
# From repository root
docker build -t mhf-worker:latest -f apps/worker/Dockerfile .
```

### 2. Run Locally
```bash
# Create .env file
cp apps/worker/.env.example apps/worker/.env
# Edit .env with your credentials

# Run container
docker run --env-file apps/worker/.env mhf-worker:latest node dist/index.js import
```

### 3. Deploy to Cloud Run
```bash
# Build and push to GCR
gcloud builds submit --tag gcr.io/YOUR_PROJECT/mhf-worker

# Deploy
gcloud run deploy mhf-worker \
  --image gcr.io/YOUR_PROJECT/mhf-worker \
  --platform managed \
  --region us-central1 \
  --set-env-vars="NODE_ENV=production"
```

## 📋 Environment Variables

### Required
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key (with newlines)

### Optional
- `OPENAI_API_KEY` - For AI-powered SEO generation
- `CLAUDE_API_KEY` - For content generation
- `GEOCODE_API_KEY` - For Google Maps geocoding

## 🕐 Scheduled Jobs

The worker supports multiple job types:

| Job | Schedule | Command |
|-----|----------|---------|
| Import | Daily 2 AM | `node dist/index.js import` |
| Analytics | Every 6 hours | `node dist/index.js analytics` |
| SEO Refresh | Daily 4 AM | `node dist/index.js seo` |
| Reports | Weekly Monday 9 AM | `node dist/index.js reports` |

## 🔧 Manual Job Execution

### Render
```bash
# SSH into worker
render ssh mhf-worker

# Run job
node dist/index.js import
```

### Railway
```bash
railway run node dist/index.js import
```

### Docker
```bash
docker exec -it mhf-worker node dist/index.js import
```

## 🔍 Monitoring

### Logs
- **Render**: Dashboard → Service → Logs
- **Railway**: `railway logs`
- **Docker**: `docker logs mhf-worker`

### Health Checks
The worker logs to Firestore:
- Import results: `/importLogs`
- Analytics: `/analytics`
- Errors: `/errors`

## 🚨 Troubleshooting

### Common Issues

1. **Firebase Authentication Error**
   ```
   Error: Could not load the default credentials
   ```
   - Ensure `FIREBASE_PRIVATE_KEY` has proper newlines
   - Use quotes around the entire key
   - Check service account permissions

2. **Build Failures**
   ```
   Error: Cannot find module
   ```
   - Ensure all dependencies are in package.json
   - Check TypeScript compilation: `npm run build`

3. **Memory Issues**
   - Increase service memory limits
   - Process data in smaller batches
   - Check for memory leaks in long-running jobs

### Debug Mode
Set `NODE_ENV=development` for verbose logging:
```bash
NODE_ENV=development node dist/index.js import
```

## 📈 Scaling

### Horizontal Scaling
- Deploy multiple worker instances
- Use job queues (Bull, BullMQ)
- Implement distributed locking

### Vertical Scaling
- Increase memory/CPU on Render/Railway
- Optimize batch sizes
- Use streaming for large datasets

## 🔐 Security

1. **Secrets Management**
   - Use platform secret management
   - Never commit `.env` files
   - Rotate service account keys regularly

2. **Network Security**
   - Whitelist IPs if needed
   - Use VPC for database access
   - Enable audit logging

3. **Access Control**
   - Limit service account permissions
   - Use separate accounts for dev/prod
   - Monitor unusual activity

## 📊 Performance Optimization

1. **Batch Processing**
   - Process 50-100 clinics per batch
   - Use Firestore batch writes
   - Implement retry logic

2. **Caching**
   - Cache geocoding results
   - Store SEO templates
   - Use Redis for frequent lookups

3. **Rate Limiting**
   - Respect API limits
   - Implement exponential backoff
   - Queue jobs during peak times