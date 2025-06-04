import { ClinicInput } from '../types/clinic';
import { ScrapedService } from './enhancedWebsiteScraper';
import { ExtractedTreatment } from './treatmentExtractor';

/**
 * Generate structured FAQ data optimized for Schema.org FAQPage markup
 * This improves SEO by enabling rich snippets in search results
 */

export interface FAQItem {
  question: string;
  answer: string;
  category?: string;
  priority?: number;
}

export interface FAQSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

/**
 * Generate comprehensive FAQs based on clinic services and treatments
 */
export function generateStructuredFAQs(
  clinic: ClinicInput,
  services: ScrapedService[],
  treatments?: ExtractedTreatment[]
): FAQItem[] {
  const faqs: FAQItem[] = [];
  
  // 1. General clinic information FAQs
  faqs.push({
    question: `What men's health services does ${clinic.name} offer?`,
    answer: `${clinic.name} provides comprehensive men's health services including ${
      services.slice(0, 5).map(s => s.service).join(', ')
    }${services.length > 5 ? ` and ${services.length - 5} more specialized treatments` : ''}. We focus on personalized care to help men optimize their health, vitality, and overall well-being.`,
    category: 'general',
    priority: 1
  });

  faqs.push({
    question: `Where is ${clinic.name} located?`,
    answer: `${clinic.name} is located at ${clinic.address} in ${clinic.city}, ${clinic.state}${
      clinic.zip ? ` ${clinic.zip}` : ''
    }. We serve patients throughout the ${clinic.city} area and surrounding communities.`,
    category: 'location',
    priority: 2
  });

  // 2. Service-specific FAQs
  const topServices = services
    .filter(s => s.confidence > 0.7)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5);

  topServices.forEach((service, index) => {
    faqs.push({
      question: `Does ${clinic.name} offer ${service.service}?`,
      answer: `Yes, ${clinic.name} specializes in ${service.service}. ${
        service.details && service.details.length > 0 
          ? `Our approach includes ${service.details.slice(0, 3).join(', ')}.` 
          : ''
      } Contact us to learn more about our ${service.service} options and schedule a consultation.`,
      category: 'services',
      priority: 10 + index
    });
  });

  // 3. Treatment-specific FAQs (for specific medications/peptides)
  if (treatments && treatments.length > 0) {
    const topTreatments = treatments
      .filter(t => t.confidence > 0.7 && t.type !== 'unknown')
      .slice(0, 5);

    topTreatments.forEach((treatment, index) => {
      const treatmentType = getTreatmentTypeDescription(treatment.type);
      
      faqs.push({
        question: `Is ${treatment.term} available at ${clinic.name}?`,
        answer: `${clinic.name} offers ${treatment.term} as part of our ${treatmentType} services. ${
          getGenericTreatmentDescription(treatment.term, treatment.type)
        } Schedule a consultation to determine if ${treatment.term} is right for your health goals.`,
        category: 'treatments',
        priority: 20 + index
      });
    });
  }

  // 4. Process and consultation FAQs
  faqs.push({
    question: `How do I schedule a consultation at ${clinic.name}?`,
    answer: `To schedule a consultation at ${clinic.name}, you can call us at ${
      clinic.phone
    }${clinic.website ? `, visit our website at ${clinic.website}` : ''}${
      clinic.email ? `, or email us at ${clinic.email}` : ''
    }. Our team will help you schedule a convenient appointment time.`,
    category: 'process',
    priority: 30
  });

  faqs.push({
    question: `What should I expect during my first visit to ${clinic.name}?`,
    answer: `During your first visit to ${clinic.name}, you'll receive a comprehensive health evaluation including a detailed medical history review, physical examination, and necessary laboratory tests. Our healthcare providers will discuss your health goals and create a personalized treatment plan tailored to your specific needs.`,
    category: 'process',
    priority: 31
  });

  // 5. Insurance and payment FAQs
  faqs.push({
    question: `What payment methods does ${clinic.name} accept?`,
    answer: `${clinic.name} accepts various payment methods to make our services accessible. Please contact our office at ${clinic.phone} to discuss payment options, financing plans, and any insurance coverage that may apply to your treatment.`,
    category: 'payment',
    priority: 40
  });

  // 6. Specialized condition FAQs based on services
  if (services.some(s => s.category === 'TRT' || s.service.toLowerCase().includes('testosterone'))) {
    faqs.push({
      question: `How do I know if I need testosterone replacement therapy?`,
      answer: `Common signs of low testosterone include fatigue, decreased libido, mood changes, and reduced muscle mass. ${clinic.name} offers comprehensive hormone testing to accurately diagnose low testosterone. Our providers will evaluate your symptoms, lab results, and medical history to determine if TRT is appropriate for you.`,
      category: 'conditions',
      priority: 50
    });
  }

  if (services.some(s => s.category === 'ED Treatment' || s.service.toLowerCase().includes('erectile'))) {
    faqs.push({
      question: `What ED treatment options are available at ${clinic.name}?`,
      answer: `${clinic.name} offers multiple ED treatment options including oral medications, injection therapies, acoustic wave therapy, and combination treatments. Our providers will work with you to find the most effective solution based on your specific condition and preferences.`,
      category: 'conditions',
      priority: 51
    });
  }

  if (services.some(s => s.category === 'Weight Loss' || s.service.toLowerCase().includes('semaglutide'))) {
    faqs.push({
      question: `What medical weight loss programs does ${clinic.name} offer?`,
      answer: `${clinic.name} provides medically supervised weight loss programs that may include FDA-approved medications, nutritional counseling, and metabolic optimization. Our programs are tailored to each patient's unique needs and health goals for sustainable results.`,
      category: 'conditions',
      priority: 52
    });
  }

  // Sort by priority
  return faqs.sort((a, b) => (a.priority || 100) - (b.priority || 100));
}

/**
 * Convert FAQs to Schema.org FAQPage format
 */
export function convertToFAQSchema(faqs: FAQItem[]): FAQSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
}

/**
 * Generate FAQ structured data script tag for HTML insertion
 */
export function generateFAQStructuredDataScript(faqs: FAQItem[]): string {
  const schema = convertToFAQSchema(faqs);
  return `<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`;
}

/**
 * Helper function to get treatment type description
 */
function getTreatmentTypeDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'peptide': 'peptide therapy',
    'medication': 'pharmaceutical',
    'therapy': 'therapeutic',
    'procedure': 'medical procedure',
    'supplement': 'nutritional supplement'
  };
  return descriptions[type] || 'treatment';
}

/**
 * Get generic treatment description based on common treatments
 */
function getGenericTreatmentDescription(term: string, type: string): string {
  const termLower = term.toLowerCase();
  
  // Peptides
  if (termLower.includes('bpc-157')) {
    return 'BPC-157 is a peptide that may support healing and recovery.';
  }
  if (termLower.includes('tb-500')) {
    return 'TB-500 is a peptide that may aid in tissue repair and recovery.';
  }
  if (termLower.includes('semaglutide') || termLower.includes('ozempic')) {
    return 'This GLP-1 medication is used for weight management under medical supervision.';
  }
  if (termLower.includes('testosterone')) {
    return 'Testosterone therapy helps restore optimal hormone levels in men with low testosterone.';
  }
  
  // Default based on type
  switch (type) {
    case 'peptide':
      return 'This peptide therapy is part of our regenerative medicine offerings.';
    case 'medication':
      return 'This medication is prescribed as part of a comprehensive treatment plan.';
    case 'therapy':
      return 'This therapy is designed to optimize your health and well-being.';
    default:
      return 'This treatment is available as part of our comprehensive men\'s health services.';
  }
}

/**
 * Validate FAQs for schema compliance
 */
export function validateFAQs(faqs: FAQItem[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  faqs.forEach((faq, index) => {
    if (!faq.question || faq.question.trim().length < 10) {
      errors.push(`FAQ ${index + 1}: Question is too short or missing`);
    }
    if (!faq.answer || faq.answer.trim().length < 50) {
      errors.push(`FAQ ${index + 1}: Answer is too short (min 50 chars for schema)`);
    }
    if (faq.answer.length > 1000) {
      errors.push(`FAQ ${index + 1}: Answer is too long (max 1000 chars recommended)`);
    }
    if (!faq.question.endsWith('?')) {
      errors.push(`FAQ ${index + 1}: Question should end with a question mark`);
    }
  });
  
  if (faqs.length < 3) {
    errors.push('At least 3 FAQs are recommended for schema markup');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}