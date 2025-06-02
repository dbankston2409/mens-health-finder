# 🔧 Men's Health Finder Worker Service - Complete Technical Guide

## Overview
The worker service is the automation backbone of Men's Health Finder, handling all background tasks from data import to analytics processing, SEO optimization, and automated communications.

---

## 🏗️ Architecture

### Core Components
```
apps/worker/
├── index.ts          # Main entry point for scheduled jobs
├── cli.ts            # Interactive CLI for manual operations
├── tasks/            # 15 automated task modules
├── utils/            # 40+ utility functions
├── webhooks/         # External service event handlers
└── types/            # TypeScript definitions
```

---

## 📋 Task Modules Breakdown

### 1. **Data Import & Processing**

#### `importClinics.ts` - Master Import Pipeline
**What it does:**
- Accepts CSV/JSON files containing clinic data
- Orchestrates the entire import process
- Handles 100+ clinics per minute with rate limiting

**Process Flow:**
```
1. Parse file (CSV or JSON)
2. Normalize each clinic record
3. Geocode addresses (with fallback)
4. Generate unique slugs
5. Apply quality tags
6. Generate SEO metadata
7. Create SEO content
8. Bulk insert to Firestore
9. Log results
```

**Key Features:**
- Duplicate detection
- Quality scoring (0-100%)
- Error recovery
- Comprehensive logging

#### `bulkVerifyClinics.ts` - Data Integrity Checker
**What it does:**
- Validates existing clinic data
- Checks website availability
- Verifies phone numbers
- Detects potential duplicates

**When to run:** Weekly or after major imports

---

### 2. **Analytics & Reporting**

#### `processAnalytics.ts` - Engagement Calculator
**What it does:**
- Aggregates daily traffic data
- Calculates engagement scores
- Updates performance metrics
- Tracks conversion events

**Metrics tracked:**
- Page views
- Phone calls
- Form submissions
- Review submissions
- Time on site

#### `generateReports.ts` - Monthly Report Generator
**What it does:**
- Creates comprehensive clinic performance reports
- Generates PDF summaries
- Sends email notifications
- Tracks month-over-month changes

**Report includes:**
- Traffic analytics
- Lead generation metrics
- SEO performance
- Revenue attribution
- Recommendations

---

### 3. **SEO Optimization**

#### `seoBatchProcessor.ts` - SEO Content Updater
**What it does:**
- Identifies clinics needing SEO updates
- Regenerates meta titles/descriptions
- Updates content for seasonal relevance
- Optimizes for local search

**Update triggers:**
- Low SEO scores
- Outdated content (90+ days)
- New services added
- Location changes

#### `runSeoIndexAudit.ts` - Google Indexing Monitor
**What it does:**
- Builds XML sitemap
- Submits to Google Search Console
- Checks indexing status
- Alerts on de-indexing

**Includes:**
- Sitemap generation
- GSC API integration
- Index status tracking
- Alert generation

#### `seoIndexingJob.ts` - Individual Index Checker
**What it does:**
- Checks each clinic's Google indexing
- Updates index status in database
- Flags indexing issues

---

### 4. **Sales & Marketing Automation**

#### `sendUpgradeEmail.ts` - Upgrade Campaign Manager
**What it does:**
- Identifies high-traffic free/basic clinics
- Generates personalized upgrade offers
- Sends targeted email campaigns
- Tracks engagement

**Targeting criteria:**
- Traffic > 100 visits/month
- Current tier = free/basic
- High engagement score
- No recent outreach

#### `queueOutreachMessages.ts` - Outreach Campaign Builder
**What it does:**
- Creates personalized outreach sequences
- Schedules follow-ups
- A/B tests messaging
- Manages campaign flow

**Campaign types:**
- Welcome sequences
- Upgrade prompts
- Re-engagement
- Review requests

#### `sendQueuedMessages.ts` - Message Delivery Engine
**What it does:**
- Processes outreach queue
- Sends emails via SendGrid
- Sends SMS via Twilio
- Handles delivery failures

**Features:**
- Rate limiting
- Retry logic
- Bounce handling
- Unsubscribe management

---

### 5. **Monitoring & Maintenance**

#### `ghostClinicScanner.ts` - Inactive Clinic Detector
**What it does:**
- Identifies clinics with no activity (90+ days)
- Tags for review
- Suggests archival
- Alerts admin team

#### `missedOpportunityScanner.ts` - Revenue Opportunity Finder
**What it does:**
- Detects upgrade opportunities
- Identifies SEO improvements
- Finds engagement gaps
- Calculates potential revenue

**Opportunities tracked:**
- Tier upgrades
- SEO optimization
- Review generation
- Lead capture

#### `runTagAudit.ts` - Quality Tag Manager
**What it does:**
- Analyzes all clinics
- Applies/updates quality tags
- Generates tag reports
- Suggests improvements

**Tags applied:**
- `missing-website`
- `invalid-phone`
- `low-quality`
- `high-performer`
- `needs-review`

---

## 🛠️ Utility Modules Detail

### Data Processing Utilities

#### `normalizeClinicData.ts`
- Standardizes clinic names (proper case)
- Formats addresses consistently
- Cleans phone numbers
- Validates required fields
- Calculates quality score

#### `geocodeAddress.ts`
- Primary: Google Maps Geocoding API
- Fallback: Nominatim (free)
- Caches results
- Handles rate limits
- Returns lat/lng + accuracy

#### `generateSlug.ts`
- Creates URL-safe slugs
- Ensures uniqueness
- Format: `clinic-name-city-state`
- Handles duplicates with numbers

### SEO Utilities

#### `generateSeoMeta.ts`
- AI-powered generation (if API key provided)
- Template-based fallback
- Local SEO optimization
- Character limit compliance
- Keyword integration

#### `generateSeoContent.ts`
- Long-form content generation
- Service-specific sections
- Local area information
- FAQ generation
- Schema markup ready

#### `calculateSeoScore.ts`
Scoring factors:
- Meta title/description quality
- Content length and relevance
- Keyword density
- Local signals
- Technical factors

### Analytics Utilities

#### `detectClinicEngagement.ts`
Calculates engagement based on:
- Traffic volume
- Conversion rate
- Review activity
- Phone calls
- Form submissions

#### `defineRevenueLeakage.ts`
Identifies lost revenue from:
- Poor SEO (lost traffic)
- Low conversion rates
- Missed upgrade opportunities
- Inactive periods

### Communication Utilities

#### `UpgradePromptEngine.ts`
- Analyzes clinic performance
- Determines best upgrade path
- Generates compelling copy
- Personalizes messaging
- A/B test variants

#### `triggerSmartNudge.ts`
Smart timing for:
- Review requests (post-visit)
- Upgrade offers (high traffic)
- Re-engagement (declining activity)
- Feature announcements

---

## 🔄 Webhook Handlers

### `trackEngagementEvents.ts`

**SendGrid Events:**
- `delivered` - Email successfully delivered
- `open` - Email opened (with tracking pixel)
- `click` - Link clicked in email
- `bounce` - Email bounced
- `unsubscribe` - User unsubscribed
- `spam_report` - Marked as spam

**Twilio Events:**
- `delivered` - SMS delivered
- `failed` - SMS failed
- `undelivered` - SMS undelivered
- `reply` - SMS reply received

**Actions taken:**
- Update contact engagement scores
- Trigger follow-up workflows
- Remove bounced contacts
- Alert on high bounce rates

---

## 📊 Data Flow Examples

### Import Flow
```
CSV File → parseClinicCSV()
    ↓
normalizeClinicData()
    ↓
geocodeAddress()
    ↓
generateSlug()
    ↓
tagClinicForReview()
    ↓
generateSeoMeta()
    ↓
generateSeoContent()
    ↓
insertOrUpdateClinic()
    ↓
logImportResults()
```

### Analytics Flow
```
Traffic Data → detectClinicEngagement()
    ↓
calculateMetrics()
    ↓
defineRevenueLeakage()
    ↓
updateAnalytics()
    ↓
generateInsights()
    ↓
alertEngine()
```

---

## 🚀 Deployment & Scaling

### Environment Variables Required
```bash
# Firebase Admin
FIREBASE_PROJECT_ID=mens-health-finder-825e0
FIREBASE_CLIENT_EMAIL=service-account@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."

# External Services
SENDGRID_API_KEY=SG.xxx
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
GOOGLE_MAPS_API_KEY=AIzaxxx

# Optional AI
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
```

### Cron Schedule (render.yaml)
```yaml
- Daily 2 AM: Import clinics
- Every 6 hours: Process analytics
- Daily 4 AM: SEO refresh
- Weekly Monday 9 AM: Generate reports
- Every 2 hours: Send queued messages
- Daily: Scan for opportunities
```

### Performance Considerations
- **Import**: 100 clinics/minute
- **Analytics**: 500 clinics/minute
- **SEO Generation**: 10 clinics/minute (with AI)
- **Message Sending**: 100 messages/minute

### Scaling Strategies
1. **Horizontal**: Deploy multiple workers
2. **Queue-based**: Implement job queue (Bull/BullMQ)
3. **Batch sizing**: Adjust batch sizes for throughput
4. **Caching**: Redis for geocoding/AI responses

---

## 🔍 Monitoring & Debugging

### Key Metrics to Monitor
- Import success rate
- Average processing time
- API rate limit usage
- Error rates by type
- Message delivery rates

### Debug Commands
```bash
# Test import with dry run
npm run worker:import -- --dry-run sample.csv

# Run specific job
node dist/index.js analytics

# Check logs
firebase functions:log --only worker

# Test individual utility
npx ts-node utils/geocodeAddress.ts
```

### Common Issues & Solutions

**Issue**: Geocoding failures
**Solution**: Check API key, implement fallback

**Issue**: High bounce rate
**Solution**: Verify email list, check sender reputation

**Issue**: Slow processing
**Solution**: Increase batch size, add caching

**Issue**: Memory issues
**Solution**: Process in smaller chunks, increase heap size

---

## 🎯 Best Practices

1. **Always use rate limiting** for external APIs
2. **Implement retry logic** with exponential backoff
3. **Log comprehensively** for debugging
4. **Monitor costs** for paid APIs
5. **Test with small batches** before full runs
6. **Keep API keys secure** in environment variables
7. **Document any custom modifications**
8. **Alert on critical failures**

---

This worker service is the heart of automation for Men's Health Finder, handling everything from data ingestion to intelligent marketing campaigns. It's designed to be reliable, scalable, and maintainable.