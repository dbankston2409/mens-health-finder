# FAQ Schema Implementation Guide

## Overview

We've implemented a comprehensive FAQ generation system that creates structured data compliant with Schema.org's FAQPage markup. This enables rich snippets in Google search results, improving visibility and click-through rates.

## Key Components

### 1. Schema FAQ Generator (`schemaFaqGenerator.ts`)
Generates structured FAQs based on:
- Clinic services and treatments
- Location information
- Common health questions
- Detected treatments (BPC-157, Semaglutide, etc.)

### 2. FAQ Categories Generated

#### General Information
- What services does the clinic offer?
- Where is the clinic located?

#### Service-Specific
- Dynamic FAQs for each detected service
- "Does [Clinic] offer [Service]?"

#### Treatment-Specific
- FAQs for specific medications/peptides
- "Is BPC-157 available at [Clinic]?"

#### Process & Consultation
- How to schedule appointments
- What to expect on first visit

#### Payment & Insurance
- Accepted payment methods
- Insurance coverage information

#### Condition-Specific
- Low testosterone symptoms
- ED treatment options
- Weight loss programs

### 3. Schema.org Compliance

Generated FAQs follow Schema.org FAQPage format:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What men's health services does Advanced Men's Clinic offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Advanced Men's Clinic provides comprehensive men's health services..."
      }
    }
  ]
}
```

## Implementation in Import Process

### During Clinic Discovery/Import:
1. Website is scraped for services and treatments
2. Treatments are extracted and categorized
3. FAQs are dynamically generated based on findings
4. Schema-compliant FAQ data is stored in Firestore

### Database Structure:
```typescript
clinic: {
  // ... other fields ...
  faqs: [
    { question: string, answer: string }
  ],
  faqSchema: {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    // ... full schema structure
  }
}
```

## Benefits

### 1. SEO Enhancement
- **Rich Snippets**: FAQs appear directly in search results
- **Increased CTR**: Users see answers before clicking
- **Voice Search**: Optimized for voice assistant queries

### 2. Dynamic Content
- FAQs automatically match clinic's actual services
- Treatment-specific questions for better relevance
- Location-specific content improves local SEO

### 3. User Experience
- Immediate answers to common questions
- Reduces support inquiries
- Builds trust with comprehensive information

## Example Output

For a clinic offering TRT and peptide therapy:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What men's health services does Austin Men's Clinic offer?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Austin Men's Clinic provides comprehensive men's health services including Testosterone Replacement Therapy, Peptide Therapy, BPC-157, TB-500, ED Treatment and 12 more specialized treatments..."
      }
    },
    {
      "@type": "Question",
      "name": "Is BPC-157 available at Austin Men's Clinic?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Austin Men's Clinic offers BPC-157 as part of our peptide therapy services. BPC-157 is a peptide that may support healing and recovery. Schedule a consultation to determine if BPC-157 is right for your health goals."
      }
    },
    {
      "@type": "Question",
      "name": "How do I know if I need testosterone replacement therapy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Common signs of low testosterone include fatigue, decreased libido, mood changes, and reduced muscle mass. Austin Men's Clinic offers comprehensive hormone testing..."
      }
    }
  ]
}
</script>
```

## Integration Checklist

- [x] Created `schemaFaqGenerator.ts` for structured FAQ generation
- [x] Updated clinic enrichment pipeline to generate FAQs
- [x] Added FAQ schema storage in database
- [x] Created `FaqSchemaScript.tsx` component for rendering
- [x] Updated `StructuredData.tsx` to include FAQ schema
- [ ] Test FAQ rich snippets in Google Search Console
- [ ] Monitor FAQ performance in search results

## Validation

Use Google's Rich Results Test to validate:
1. Go to https://search.google.com/test/rich-results
2. Enter clinic page URL
3. Verify FAQPage detection
4. Check for any errors or warnings

## Future Enhancements

1. **AI-Powered Answers**: Use Claude to generate more detailed, medically accurate answers
2. **User-Generated FAQs**: Track common search queries to add new FAQs
3. **Multi-Language Support**: Generate FAQs in Spanish for broader reach
4. **Video FAQs**: Add VideoObject schema for video answers