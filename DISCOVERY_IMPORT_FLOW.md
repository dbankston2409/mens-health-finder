# Complete Clinic Discovery Import Process Flow

## Overview
The discovery import process is a multi-stage pipeline that finds, enriches, and imports men's health clinics with detailed service information.

## Process Flow Diagram

```
┌─────────────────────┐
│  1. Grid Generation │ 
│  (US Map Coverage)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 2. Google Places    │
│    Discovery        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 3. Basic Import &   │
│    Deduplication    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 4. Website Scraping │
│    & Enrichment     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 5. SEO Content      │
│    Generation       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 6. Review Import &  │
│    Final Publishing │
└─────────────────────┘
```

## Detailed Stage Breakdown

### Stage 1: Grid Generation (10-mile radius cells)
```typescript
// GridGenerator creates search areas across the US
const grids = gridGenerator.generateGridsForStrategy('metro_first');
// Returns ~3,000-5,000 grid cells covering the US
```

**What happens:**
- Creates geographic grid cells (10-mile radius each)
- Prioritizes metro areas first
- Tracks which areas have been searched
- Enables pause/resume functionality

### Stage 2: Google Places Discovery
```typescript
// For each grid cell, search for men's health clinics
for (const grid of grids) {
  const places = await searchNearby({
    location: { lat: grid.lat, lng: grid.lng },
    radius: 16093, // 10 miles in meters
    keyword: 'mens health clinic testosterone TRT'
  });
}
```

**Data collected:**
- Business name, address, phone
- Google Place ID
- Location coordinates
- Business hours
- Google reviews & ratings
- Website URL (if available)
- Basic category info

### Stage 3: Basic Import & Deduplication
```typescript
// Check if clinic already exists
const existingClinic = await findByAddress(place.address);
if (!existingClinic) {
  const clinic = await saveClinic({
    name: place.name,
    address: place.address,
    city: place.city,
    state: place.state,
    phone: place.phone,
    website: place.website,
    googlePlaceId: place.place_id,
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    hours: place.opening_hours,
    rating: place.rating,
    reviewCount: place.user_ratings_total,
    status: 'pending_enrichment',
    tier: 'free' // Default tier
  });
}
```

**Key features:**
- Address-based deduplication
- Normalizes phone numbers
- Generates URL slug
- Sets initial tier as 'free'
- Marks for enrichment

### Stage 4: Website Scraping & Enrichment
```typescript
// Enrichment pipeline runs after basic import
const enrichmentPipeline = new ClinicEnrichmentPipeline();

// For clinics with websites
if (clinic.website) {
  const scrapingResult = await scraper.scrapeWebsite(clinic.website);
  
  // Example scraped data:
  {
    services: [
      { category: 'TRT', confidence: 0.95, 
        context: 'Testosterone Replacement Therapy starting at $199/month' },
      { category: 'ED Treatment', confidence: 0.9,
        context: 'GAINSWave acoustic therapy for erectile dysfunction' },
      { category: 'Weight Loss', confidence: 0.85,
        context: 'Semaglutide medical weight loss program' }
    ],
    additionalInfo: {
      acceptsInsurance: true,
      hasFinancing: true,
      specializations: ['Anti-Aging', 'Sports Medicine']
    }
  }
}
```

**What's extracted:**
- Detailed service offerings
- Pricing information
- Treatment specifics
- Insurance/financing options
- Specializations
- Unique procedures/equipment

### Stage 5: SEO Content Generation
```typescript
// Generate enhanced content using scraped data
const seoContent = await generateEnhancedSeoContent(clinic, scrapingResult);

// Generate FAQs based on services
const faqs = generateServiceBasedFAQs(clinic, scrapingResult.services);

// Update clinic with enriched data
await updateClinic(clinic.id, {
  services: verifiedServices, // ['TRT', 'ED Treatment', 'Weight Loss']
  'seoMeta.content': seoContent, // 700-1,000 words
  'seoMeta.description': metaDescription, // 150-160 chars
  faqs: faqs, // 5-7 relevant Q&As
  specializations: ['Anti-Aging', 'Sports Medicine'],
  enrichmentData: {
    lastEnriched: new Date(),
    servicesVerified: 12,
    scrapingConfidence: 0.89
  }
});
```

**Generated content includes:**
- 700-1,000 word SEO-optimized description
- Service-specific FAQs
- Meta descriptions
- Structured data markup

### Stage 6: Review Import & Final Publishing
```typescript
// Import Google reviews
const reviews = await placeDetails.getReviews(clinic.googlePlaceId);
await importReviews(clinic.id, reviews);

// Generate final structured data
const structuredData = generateMedicalClinicSchema(clinic);

// Update status to published
await updateClinic(clinic.id, {
  status: 'active',
  publishedAt: new Date(),
  seoIndexStatus: 'pending'
});

// Add to sitemap
await addToSitemap(clinic);

// Ping Google Search Console
await pingSearchEngines(clinic.url);
```

## Complete Data Flow Example

### Input (Google Places):
```json
{
  "name": "Dallas Men's Health",
  "address": "123 Main St, Dallas, TX 75201",
  "phone": "(214) 555-0123",
  "website": "https://dallasmenhealth.com",
  "category": "Medical clinic"
}
```

### After Website Scraping:
```json
{
  "name": "Dallas Men's Health",
  "address": "123 Main St, Dallas, TX 75201",
  "services": [
    "TRT - Testosterone Replacement Therapy",
    "ED Treatment - GAINSWave & P-Shot",
    "Medical Weight Loss - Semaglutide",
    "Peptide Therapy - BPC-157, TB-500",
    "IV Therapy - NAD+ Infusions"
  ],
  "pricing": {
    "TRT": "$199-299/month",
    "GAINSWave": "$3,000 for 6 sessions",
    "Semaglutide": "$399/month"
  },
  "specializations": ["Anti-Aging", "Sexual Health", "Weight Loss"],
  "acceptsInsurance": true,
  "hasFinancing": true
}
```

### Final Output:
```json
{
  "name": "Dallas Men's Health",
  "slug": "dallas-mens-health-dallas-tx",
  "services": ["TRT", "ED Treatment", "Weight Loss", "Peptide Therapy", "IV Therapy"],
  "seoContent": "Dallas Men's Health specializes in comprehensive testosterone replacement therapy (TRT) with programs starting at $199 per month. Located in the heart of Dallas, this state-of-the-art men's health clinic offers cutting-edge treatments including GAINSWave acoustic therapy for erectile dysfunction, medical weight loss with Semaglutide, and advanced peptide protocols featuring BPC-157 and TB-500...[700+ words]",
  "faqs": [
    {
      "question": "What types of testosterone therapy does Dallas Men's Health offer?",
      "answer": "We offer multiple TRT options including weekly injections, bi-weekly injections, topical gels, and long-lasting pellet therapy. Our programs start at $199/month and include regular monitoring and adjustments."
    },
    {
      "question": "Does Dallas Men's Health accept insurance?",
      "answer": "Yes, we accept most major insurance plans for covered services. We also offer affordable self-pay options and financing through CareCredit for treatments not covered by insurance."
    }
  ],
  "structuredData": {
    "@type": "MedicalClinic",
    "medicalSpecialty": "Testosterone Therapy, Erectile Dysfunction Treatment, Medical Weight Loss",
    "priceRange": "$$$"
  }
}
```

## Timing & Performance

### Typical Processing Times:
- **Google Places Search**: 1-2 seconds per grid
- **Basic Import**: < 1 second per clinic  
- **Website Scraping**: 5-15 seconds per clinic
- **SEO Generation**: 3-5 seconds per clinic
- **Total per clinic**: ~20-25 seconds

### Daily Processing Capacity:
- **Conservative**: 1,000-2,000 clinics/day
- **Aggressive**: 3,000-5,000 clinics/day
- **With breaks**: Sustainable long-term operation

## Error Handling & Recovery

### Common Scenarios:
1. **No website**: Skip enrichment, use Google data only
2. **Website down**: Mark for retry later
3. **Scraping blocked**: Flag for manual review
4. **No services found**: Use fallback content generation
5. **API limits**: Automatic rate limiting and retry

### Quality Assurance:
```typescript
// Each clinic goes through validation
const qualityChecks = {
  hasName: true,
  hasAddress: true,
  hasPhone: true,
  servicesFound: clinic.services.length > 0,
  seoContentLength: clinic.seoContent.length > 700,
  faqsGenerated: clinic.faqs.length >= 3,
  structuredDataValid: validateSchema(clinic.structuredData)
};

// Only publish if passes quality checks
if (Object.values(qualityChecks).every(check => check)) {
  await publishClinic(clinic);
} else {
  await flagForReview(clinic, qualityChecks);
}
```

## Monitoring & Analytics

### Track Key Metrics:
- Clinics discovered per day
- Enrichment success rate
- Average services found per clinic
- SEO content generation success
- Processing time per stage
- Error rates by type

### Dashboard View:
```
📊 Discovery Pipeline Status
━━━━━━━━━━━━━━━━━━━━━━━━━
Today's Progress:
✓ Grids Searched: 127/500
✓ Clinics Found: 89
✓ Clinics Enriched: 67
✓ SEO Generated: 65
✓ Published: 63

Success Rates:
• Website Scraping: 75%
• Service Detection: 82%
• Content Generation: 97%

Avg Services/Clinic: 6.3
Avg Processing Time: 22s
```

## Cost Efficiency

### API Costs (Monthly):
- Google Places: ~$200-300
- Google Maps: ~$50-100
- Claude API: ~$50-100
- **Total: ~$300-500/month**

### Compared to:
- Yelp API: $600/month
- Manual data entry: $2,000+/month
- Other data providers: $1,000+/month

## Summary

The discovery import process transforms basic Google Places data into rich, SEO-optimized clinic profiles through intelligent website scraping and content generation. This automated pipeline can process thousands of clinics while maintaining high quality and specific service details that set your directory apart from competitors.