# MHF Import Engine

The Men's Health Finder Import Engine is a modular, resilient, scalable clinic import pipeline that processes CSV or JSON clinic data and creates high-quality, SEO-optimized clinic records in Firestore.

## 🏗️ Architecture

### Core Pipeline
```
CSV/JSON Input → Parse → Normalize → Geocode → Generate Slug → Tag Review → SEO Meta → SEO Content → Firestore
```

### Modules

1. **parseClinicCSV.ts** - Parse CSV files with header normalization
2. **parseClinicJSON.ts** - Parse JSON files with key normalization  
3. **normalizeClinicData.ts** - Standardize and validate clinic data
4. **geocodeAddress.ts** - Geocode addresses using Google Maps or Nominatim
5. **generateSlug.ts** - Create unique URL-safe slugs
6. **tagClinicForReview.ts** - Apply quality and validation tags
7. **generateSeoMeta.ts** - Generate SEO titles, descriptions, keywords
8. **generateSeoContent.ts** - Generate SEO-rich content blocks
9. **insertOrUpdateClinic.ts** - Upsert clinics to Firestore
10. **logImportResults.ts** - Comprehensive import reporting

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:worker
```

### 2. Configure Environment
Copy and update `.env.worker` with your Firebase Admin SDK credentials:

```bash
# Required - Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# Optional - Enhanced Features
OPENAI_API_KEY=sk-...          # For dynamic SEO generation
CLAUDE_API_KEY=sk-ant-...      # For rich content generation
GEOCODE_API_KEY=AIza...        # For precise geocoding
```

### 3. Run Import
```bash
# From monorepo root
npm run worker:import path/to/clinics.csv

# Or with specific file
npm run worker:import /Users/you/data/clinics.json

# Or use the sample file
npm run worker:import sample-clinics.csv
```

## 📊 Data Format

### Input CSV Format
```csv
name,address,city,state,zip,phone,website,services,package,status
"Austin Men's Health","123 Main St","Austin","TX","78701","(512) 555-0123","https://example.com","TRT,ED Treatment","premium","active"
```

### Input JSON Format
```json
[
  {
    "name": "Austin Men's Health",
    "address": "123 Main St",
    "city": "Austin",
    "state": "TX",
    "zip": "78701",
    "phone": "(512) 555-0123",
    "website": "https://example.com",
    "services": "TRT,ED Treatment",
    "package": "premium",
    "status": "active"
  }
]
```

### Output Firestore Structure
```javascript
clinics/{slug} = {
  name: "Austin Men's Health",
  address: "123 Main St",
  city: "Austin",
  state: "TX",
  zip: "78701",
  phone: "(512) 555-0123",
  website: "https://example.com",
  services: ["TRT", "ED Treatment"],
  package: "premium",
  status: "active",
  tags: ["high-quality"],
  lat: 30.2672,
  lng: -97.7431,
  slug: "austin-mens-health-austin-tx",
  seoMeta: {
    title: "Austin Men's Health - TRT in Austin, TX",
    description: "Leading men's health clinic in Austin, TX. Specializing in TRT, ED Treatment. Call today for consultation.",
    keywords: ["austin men's health", "trt austin", "testosterone therapy"],
    indexed: false
  },
  seoContent: "<div class='seo-content'>...</div>",
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

## 🏷️ Quality Tags

The system automatically applies quality tags:

- `missing-website` - No website provided
- `invalid-phone` - Phone number invalid
- `incomplete-address` - Missing address components
- `website-down` - Website not reachable
- `geo-mismatch` - Geocoding failed
- `potential-duplicate` - Possible duplicate clinic
- `low-quality` - Quality score < 60%
- `high-quality` - Quality score > 90%

## 📈 Features

### Resilient Processing
- Automatic retry logic for failed operations
- Graceful handling of API rate limits
- Comprehensive error tracking and reporting

### SEO Optimization
- Dynamic SEO meta generation with OpenAI
- Rich content creation with Claude
- Local SEO keyword optimization
- Schema-ready structured data

### Geocoding
- Primary: Google Maps API (precise)
- Fallback: Nominatim (free)
- Accuracy classification: exact/approximate/failed

### Quality Assurance
- Data validation and normalization
- Website reachability checking
- Duplicate detection
- Quality scoring (0-100%)

## 🔧 Advanced Usage

### Custom Processing
```typescript
import { importClinics } from './tasks/importClinics';

// Process specific file
await importClinics('/path/to/custom-data.csv');
```

### Batch Processing
```bash
# Process multiple files
npm run worker:import file1.csv
npm run worker:import file2.json
npm run worker:import file3.csv
```

### Monitoring
Import results are logged to:
- Console (detailed progress)
- Firestore `/importLogs` collection
- Error tracking with counts and samples

## 🚀 Deployment

### Development
```bash
npm run worker:import sample-clinics.csv
```

### Production
Deploy as background service on Render/Railway:

```bash
# Command
npm run worker:import

# Schedule: Daily at 2:00 AM
# Environment: Production .env.worker
```

### Cron Job Setup
```bash
# Add to crontab
0 2 * * * cd /app && npm run worker:import /data/daily-clinics.csv
```

## 📊 Performance

- **Throughput**: ~100 clinics/minute (with geocoding)
- **Rate Limits**: 100ms delay between clinics
- **Memory**: ~50MB for 1000 clinics
- **Firestore**: Batched writes for efficiency

## 🔍 Troubleshooting

### Common Issues

1. **Firebase Permissions**
   ```
   Error: Missing or insufficient permissions
   ```
   - Verify service account has Firestore write access
   - Check FIREBASE_PRIVATE_KEY format (escaped newlines)

2. **Geocoding Failures**
   ```
   Warning: Geocoding failed for clinic
   ```
   - Verify address format
   - Check GEOCODE_API_KEY if using Google Maps
   - Fallback to manual lat/lng in CSV

3. **SEO Generation Issues**
   ```
   Warning: OpenAI/Claude generation failed
   ```
   - System falls back to template-based generation
   - Verify API keys if dynamic generation needed

### Debug Mode
```bash
NODE_ENV=development npm run worker:import sample-clinics.csv
```

## 📋 Monitoring Dashboard

View import results:
- Firestore Console: `/importLogs` collection
- Import summary with success/failure rates
- Error categorization and samples
- Performance metrics and duration

## 🤝 Contributing

1. Add new validation tags in `tagClinicForReview.ts`
2. Enhance SEO templates in `generateSeoMeta.ts`
3. Improve geocoding accuracy in `geocodeAddress.ts`
4. Add new input formats in parser modules