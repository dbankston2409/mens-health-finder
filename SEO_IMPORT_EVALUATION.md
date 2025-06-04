# SEO & Import Process Evaluation

## 1. Word Count Adjustment (500-700 → 700-1000)

### Current Implementation
- **Location**: `/apps/worker/utils/generateSeoContent.ts`
- **Current**: 500-700 words mandatory
- **Method**: Claude API with explicit word count instruction

### Required Changes
To adjust to 700-1000 words, update the prompt in `generateSeoContent.ts`:

```typescript
// Line to change:
"Word Count: 500–700 words (MUST be at least 500 words — verify before finalizing)"

// Change to:
"Word Count: 700–1,000 words (MUST be at least 700 words — verify before finalizing)"
```

Also update the development template generator in `/apps/web/utils/seo/contentGenerator.ts` to generate longer content.

## 2. Current Content Building Logic

### Production Environment
- **AI-Powered**: Uses Claude API (Sonnet model) for high-quality content
- **Structured Approach**:
  1. Introduction with clinic name and location
  2. Service overview (2-4 paragraphs)
  3. Why choose this clinic (1-2 paragraphs)
  4. Local area tie-in
  5. Call to action

### Development Environment
- **Template-Based**: Fallback content generator
- **Components**: Pre-written paragraphs assembled based on services

## 3. Pulling Clinic Specialties & Offerings

### Data Sources
1. **CSV Import**: Services parsed from CSV using `;` or `|` delimiters
2. **Normalization**: `/apps/worker/utils/normalizeClinicData.ts`
   ```
   TRT, Testosterone → "TRT"
   ED, Erectile → "ED Treatment"
   Weight Loss → "Weight Loss"
   Hair → "Hair Restoration"
   Hormone → "Hormone Therapy"
   ```
3. **Storage**: Stored in `clinic.services` array

### Enhancement Opportunity
Currently pulling basic services. Could enhance by:
- Adding `specialties` field for medical specializations
- Adding `procedures` field for specific treatments
- Adding `conditions` field for treated conditions

## 4. FAQ Generation

### Current State
- **Manual Process**: FAQs stored in `clinic.faqs` field
- **No Auto-Generation**: FAQs must be manually added
- **Fallback**: Generic category FAQs shown if clinic has none

### Recommended Enhancement
Implement automatic FAQ generation:
```typescript
// Add to import process
async function generateClinicFAQs(clinic: Clinic) {
  const faqs = [];
  
  // Service-specific FAQs
  if (clinic.services.includes('TRT')) {
    faqs.push({
      question: "How long does TRT treatment take to show results?",
      answer: "Most patients notice improvements in energy and mood within 3-4 weeks..."
    });
  }
  
  // Location-specific FAQ
  faqs.push({
    question: `What areas near ${clinic.city} does ${clinic.name} serve?`,
    answer: `We serve patients from ${clinic.city} and surrounding areas...`
  });
  
  return faqs;
}
```

## 5. Schema Markup Validation ✅

### Current Implementation (CONFIRMED)
All required fields are properly implemented in `/apps/web/utils/seo.ts`:

```typescript
{
  "@type": "MedicalClinic",
  "name": clinic.name,
  "telephone": clinic.phone,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": clinic.address,
    "addressLocality": clinic.city,
    "addressRegion": clinic.state,
    "postalCode": clinic.zip
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": clinic.lat,
    "longitude": clinic.lng
  },
  "openingHoursSpecification": [...],
  "aggregateRating": {...},
  "medicalSpecialty": clinic.services.join(", "),
  "makesOffer": [services mapped to MedicalProcedure]
}
```

### Missing Elements to Add:
- ❌ Physician info (not currently stored)
- ❌ FAQ schema (FAQs exist but not in schema)
- ✅ Reviews (aggregateRating included)

## 6. Interlinking Process ✅

### Currently Implemented:
1. **Breadcrumb Navigation**: Home → Category → State → City → Clinic
2. **Related Clinics Widget**: Shows 2 related paid clinics in same city
3. **Category Pages**: Proper hierarchy at all levels
4. **"Other Clinics" Section**: Links back to city directory

### Missing/Recommended:
- ❌ "See other TRT clinics in [city]" buttons
- ❌ Global footer with top categories
- ❌ Service-specific related clinics

### Implementation Plan:
```typescript
// Add to clinic detail page
<ServiceCategoryLinks 
  city={clinic.city}
  state={clinic.state}
  services={clinic.services}
/>

// Add to Layout.tsx footer
<FooterCategoryLinks categories={topCategories} />
```

## 7. Indexing Process Evaluation

### ✅ Currently Implemented:
1. **Sitemap Generation**:
   - Automated via `generateSitemap.js`
   - Includes all page types
   - Filters inactive clinics
   - Proper XML format

2. **GSC Pinging**:
   - Automatic pinging on sitemap update
   - Includes Bing notification
   - Error handling and retries

3. **robots.txt**:
   - Properly configured
   - Blocks admin pages
   - References sitemap

### ✅ Static Pre-rendering:
- Next.js SSG/ISR implemented
- Static pages for better performance
- Dynamic routes pre-rendered

### ❌ Areas for Improvement:
1. **Noindex Implementation**: Need to add for:
   - Zero-result pages
   - Filter-only pages
   - Duplicate content pages

2. **Sitemap Optimization**:
   ```typescript
   // Add logic to exclude:
   if (clinics.length === 0) return null; // Don't include empty category pages
   if (page.params.includes('filter')) return null; // Skip filter URLs
   ```

## Recommendations

### Immediate Actions:
1. **Update word count** in generateSeoContent.ts to 700-1000
2. **Add FAQ schema** to existing FAQ data
3. **Implement physician info** collection during import
4. **Add service-specific interlinking** buttons

### Phase 2 Enhancements:
1. **Auto-generate FAQs** based on services and location
2. **Enhanced specialty data** collection
3. **Implement noindex** for low-value pages
4. **Add global footer** category links

### Code Changes Needed:

1. **Update Content Generator**:
```typescript
// In generateSeoContent.ts
const WORD_COUNT_REQUIREMENT = "700–1,000 words (MUST be at least 700 words)";
```

2. **Add FAQ Schema**:
```typescript
// In seo.ts
if (clinic.faqs?.length > 0) {
  schema['@graph'].push({
    "@type": "FAQPage",
    "mainEntity": clinic.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  });
}
```

3. **Add Footer Categories**:
```typescript
// In Footer.tsx
const topCategories = [
  { name: 'TRT Clinics', href: '/trt-clinics' },
  { name: 'ED Treatment', href: '/ed-treatment' },
  { name: 'Weight Loss', href: '/weight-loss-clinics' }
];
```

## Summary

The system has strong foundations with proper schema markup, good interlinking, and automated indexing. Main improvements needed:
1. Increase content word count
2. Add FAQ automation
3. Enhance interlinking with service-specific links
4. Add physician data collection
5. Implement selective noindex

All core SEO requirements are met, but these enhancements will improve rankings and user experience.