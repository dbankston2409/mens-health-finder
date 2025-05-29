# Tier Implementation Plan for Men's Health Finder

## 1. Standardize Tier Nomenclature

### Current Issues
- Inconsistent tier naming: `package`, `packageTier`, and `tier` fields
- Inconsistent values: 'Free'/'free', 'Basic'/'basic'/'low', 'Premium'/'premium'/'high'

### Solution
1. Standardize on a single field: `tier`
2. Use consistent enum values that match the business requirements:
   - `free` → Free tier
   - `standard` → Standard tier (currently 'low' or 'basic')
   - `advanced` → Advanced tier (currently 'high' or 'premium')
3. Update type definitions to reflect these changes

## 2. Update Firestore Data Structure

1. Add/update fields in all clinic documents:
   - `tier: "free" | "standard" | "advanced"`
   - `seo.description`: String (500+ word markdown)
   - `seo.keywords`: String array
   - `tierFeatures`: JSON object showing active features

2. Create a utility function to generate `tierFeatures` based on tier:
   ```typescript
   function generateTierFeatures(tier: 'free' | 'standard' | 'advanced'): TierFeatures {
     const features = {
       fullProfile: true, // All tiers get this
       seoDescription: true, // All tiers get this
       publicContact: true, // All tiers get this
       locationMapping: true, // All tiers get this
       basicSearch: true, // All tiers get this
       
       // Standard tier features
       verifiedBadge: tier !== 'free',
       enhancedSearch: tier !== 'free',
       treatmentsLimit: tier === 'free' ? 5 : (tier === 'standard' ? 10 : 20),
       reviewDisplay: tier === 'free' ? 'basic' : (tier === 'standard' ? 'enhanced' : 'premium'),
       
       // Advanced tier features
       enhancedContactUX: tier === 'advanced',
       customTracking: tier === 'advanced',
       snapshotReport: tier === 'advanced',
       priorityListing: tier === 'advanced',
     };
     
     return features;
   }
   ```

3. Create a data migration script to update existing documents

## 3. Update Type Definitions

```typescript
// In types/index.ts
export interface Clinic {
  // ... existing fields
  tier: 'free' | 'standard' | 'advanced';
  seo?: {
    description: string; // 500+ word markdown
    keywords: string[]; // SEO keywords
  };
  tierFeatures?: {
    fullProfile: boolean;
    seoDescription: boolean;
    publicContact: boolean;
    locationMapping: boolean;
    basicSearch: boolean;
    verifiedBadge: boolean;
    enhancedSearch: boolean;
    treatmentsLimit: number;
    reviewDisplay: 'basic' | 'enhanced' | 'premium';
    enhancedContactUX: boolean;
    customTracking: boolean;
    snapshotReport: boolean;
    priorityListing: boolean;
  };
  // ... other fields
}
```

## 4. Update UI Components

### TierBadge Component
- Update to support new tier values ('free', 'standard', 'advanced')
- Update display text and styling

### Profile Page Rendering
- Add conditional rendering based on tier:
  - Always render full SEO content
  - Show verified badge for 'standard' and 'advanced'
  - Enhanced contact UX for 'advanced'
  - Limit treatments list based on tier

### Search & Map Components
- Update sorting logic to prioritize by tier
- Update map marker styling based on tier

## 5. Update Admin UI

- Add tier selection dropdown to Clinic Editor
- Add toggles for tier-specific features:
  - "Verified" (standard & advanced)
  - "Enable Snapshot Report" (advanced)
  - "Enable Custom Tracking" (advanced)
- Enforce feature limits based on tier

## 6. Analytics Integration

- Add global GA4 + GSC tags to all public pages
- For advanced clinics:
  - Implement custom tracking ID integration
  - Add admin toggle for per-clinic tracking

## 7. Upgrade Nudges

- Add upgrade CTA banner for 'free' and 'standard' clinics
- Implement upgrade button in user dashboard

## 8. SEO & ISR Updates

- Update SEO meta tags to use `seo.description` and `seo.keywords`
- Update sitemap generation to include all clinics
- Set 24h revalidation for clinic pages

## Implementation Order

1. Update type definitions
2. Create utility functions for tier features
3. Update Firestore schema & migration script
4. Update UI components for displaying tier-specific content
5. Update admin UI for editing tier information
6. Implement analytics integration
7. Add upgrade nudges
8. Update SEO components & revalidation