# Category Migration Plan

## Current Categories → New Categories Mapping

### Old Categories:
1. `trt` / `testosterone-therapy` → **Hormone Optimization**
2. `ed` / `erectile-dysfunction` → **Sexual Health**
3. `hairloss` / `hair-loss` → **Hair Loss & Aesthetics**
4. `weightloss` / `weight-management` → **Weight Loss & Metabolic**
5. `peptide-therapy` → **Peptides & Performance**
6. `iv-therapy` → **IV & Injection Therapy**
7. `cryotherapy` → **Regenerative Medicine**

### New Categories to Add:
8. **Diagnostics & Panels** (new)

## New Category Structure

```typescript
{
  id: 'hormone-optimization',
  title: 'Hormone Optimization',
  slug: 'hormone-optimization',
  description: 'Comprehensive hormone replacement therapy including testosterone, HGH, and thyroid optimization'
},
{
  id: 'sexual-health',
  title: 'Sexual Health',
  slug: 'sexual-health',
  description: 'Advanced treatments for erectile dysfunction, premature ejaculation, and sexual wellness'
},
{
  id: 'peptides-performance',
  title: 'Peptides & Performance',
  slug: 'peptides-performance',
  description: 'Cutting-edge peptide therapies for performance enhancement, recovery, and longevity'
},
{
  id: 'hair-loss-aesthetics',
  title: 'Hair Loss & Aesthetics',
  slug: 'hair-loss-aesthetics',
  description: 'Hair restoration treatments, PRP therapy, and aesthetic services for men'
},
{
  id: 'weight-loss-metabolic',
  title: 'Weight Loss & Metabolic',
  slug: 'weight-loss-metabolic',
  description: 'Medical weight management, metabolic optimization, and body composition improvement'
},
{
  id: 'iv-injection-therapy',
  title: 'IV & Injection Therapy',
  slug: 'iv-injection-therapy',
  description: 'IV nutrient therapy, vitamin injections, and hydration treatments'
},
{
  id: 'regenerative-medicine',
  title: 'Regenerative Medicine',
  slug: 'regenerative-medicine',
  description: 'Stem cell therapy, PRP treatments, and advanced regenerative procedures'
},
{
  id: 'diagnostics-panels',
  title: 'Diagnostics & Panels',
  slug: 'diagnostics-panels',
  description: 'Comprehensive lab testing, hormone panels, and health diagnostics'
}
```

## Files to Update

### 1. Core Definitions
- [ ] `/lib/mockData.ts` - Update `serviceCategories` array
- [ ] `/lib/utils.ts` - Update `serviceCategoryMap` and related functions
- [ ] `/types/index.ts` - Update any category type definitions

### 2. Components
- [ ] `/components/FilterBar.tsx` - Update SERVICE_OPTIONS
- [ ] `/components/SearchSuggestions.tsx` - Update any hardcoded categories
- [ ] `/components/admin/clinic/sections/ClinicInfoSection.tsx` - Update service options

### 3. Page Content
- [ ] `/pages/index.tsx` - Update homepage category links
- [ ] `/pages/[category]/index.tsx` - Ensure dynamic handling
- [ ] Blog posts that reference old categories

### 4. SEO & Content
- [ ] Update meta descriptions
- [ ] Update structured data
- [ ] Update any hardcoded SEO content

### 5. Database Migration
- [ ] Update existing clinic services arrays
- [ ] Update search indexes if needed
- [ ] Update any stored category references

## Implementation Steps

1. **Backup Current Data**
2. **Update Core Definitions**
3. **Update URL Routing**
4. **Update UI Components**
5. **Test All Category Pages**
6. **Update Existing Clinic Data**
7. **Set Up Redirects** (old URLs → new URLs)

## URL Redirect Mapping

```
/testosterone-therapy → /hormone-optimization
/erectile-dysfunction → /sexual-health
/hair-loss → /hair-loss-aesthetics
/weight-management → /weight-loss-metabolic
/peptide-therapy → /peptides-performance
/iv-therapy → /iv-injection-therapy
/cryotherapy → /regenerative-medicine
```

## Search & Filter Updates

Update search keywords to include:
- Old terms (for backward compatibility)
- New category names
- Related medical terms

## Testing Checklist

- [ ] All category pages load correctly
- [ ] Filtering works with new categories
- [ ] Search returns correct results
- [ ] Breadcrumbs show correct names
- [ ] URLs are SEO-friendly
- [ ] Old URLs redirect properly
- [ ] Admin panel shows new categories
- [ ] Clinic services display correctly