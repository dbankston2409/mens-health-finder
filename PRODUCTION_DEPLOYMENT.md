# Men's Health Finder - Production Deployment Guide

## Phase 1: Infrastructure Setup ✅ COMPLETED
- Firebase project creation
- Environment configuration  
- External services setup
- Security headers implementation

## Phase 2: Data and Security Setup

### Week 2: Database and Security Configuration

#### 2.1 Firestore Database Setup
```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Create Firestore indexes
firebase deploy --only firestore:indexes
```

#### 2.2 Create Production Admin User
```javascript
// Run this script in Firebase Functions or Admin SDK
const admin = require('firebase-admin');

async function createAdminUser() {
  const userRecord = await admin.auth().createUser({
    email: 'your-admin@email.com',
    password: 'secure-temp-password',
    displayName: 'Admin User'
  });
  
  // Set admin custom claims
  await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
  
  console.log('Admin user created:', userRecord.uid);
}
```

#### 2.3 Data Migration Strategy
1. **Export Development Data**
   ```bash
   # Export collections
   npx firestore-export --accountCredentials ./serviceAccountKey.json --backupFile ./backup.json
   ```

2. **Sanitize and Import to Production**
   ```bash
   # Import to production (after data review)
   npx firestore-import --accountCredentials ./prod-serviceAccountKey.json --backupFile ./backup.json
   ```

#### 2.4 Security Testing Checklist
- [ ] Test authentication flows
- [ ] Verify admin-only routes are protected
- [ ] Test Firestore security rules
- [ ] Validate API endpoint security
- [ ] Check CORS configuration

## Phase 3: Deployment and Go-Live

### Week 3: Production Deployment

#### 3.1 Environment Variables Setup
Create `.env.production`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-prod-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-prod-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-prod-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-prod-bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# External Services
SENDGRID_API_KEY=your-sendgrid-key
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
GOOGLE_MAPS_API_KEY=your-maps-key

# Analytics
GOOGLE_ANALYTICS_ID=your-ga-id
```

#### 3.2 Vercel Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production
# ... repeat for all env vars
```

#### 3.3 Domain Configuration
1. Configure custom domain in Vercel dashboard
2. Update Firebase authorized domains
3. Update CORS settings for API endpoints

#### 3.4 Monitoring Setup
```javascript
// Add to _app.tsx for error tracking
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  const analytics = getAnalytics(app);
}
```

## Phase 4: Post-Launch Optimization

### Week 4: Performance and Monitoring

#### 4.1 Performance Optimization
- [ ] Enable Next.js Image Optimization
- [ ] Implement CDN for static assets
- [ ] Configure caching strategies
- [ ] Optimize Firestore queries with indexes

#### 4.2 Monitoring Dashboard
- [ ] Google Analytics setup
- [ ] Firebase Performance Monitoring
- [ ] Error tracking (Sentry recommended)
- [ ] Uptime monitoring

#### 4.3 SEO Final Setup
```bash
# Generate production sitemap
npm run generate-sitemap

# Submit to search engines
# - Google Search Console
# - Bing Webmaster Tools
```

## Critical Production Checklist

### Security ✅
- [x] Firestore security rules deployed
- [x] Security headers configured
- [ ] SSL certificate active
- [ ] Admin user created with proper claims
- [ ] API keys secured in environment variables

### Performance
- [ ] Next.js production build optimized
- [ ] Images optimized and served via CDN
- [ ] Firestore indexes created for all queries
- [ ] Caching strategies implemented

### Functionality
- [ ] All user flows tested in production
- [ ] Admin panel fully functional
- [ ] Payment processing (if applicable) tested
- [ ] Email notifications working
- [ ] Phone tracking operational

### Compliance
- [ ] Privacy policy updated
- [ ] Terms of service current
- [ ] GDPR compliance verified
- [ ] Healthcare data handling compliant

## Emergency Rollback Plan

If issues arise:
1. **Immediate**: Revert to previous Vercel deployment
2. **Database**: Use Firestore backup to restore data
3. **DNS**: Point domain back to staging if needed

## Support and Maintenance

### Weekly Tasks
- Monitor error logs
- Review performance metrics
- Check security alerts
- Update dependencies

### Monthly Tasks
- Database backup verification
- Security audit
- Performance optimization review
- Content updates

---

**Estimated Timeline**: 4 weeks for full production deployment
**Key Dependencies**: Firebase project approval, domain registration, external service API approvals