import { ClinicInput } from '../types/clinic';
import { WebsiteScrapingResult, ScrapedService } from './enhancedWebsiteScraper';
import fetch from 'node-fetch';

/**
 * Enhanced SEO content generator that uses scraped website data
 * Creates highly specific, detailed content based on actual services offered
 */

interface EnhancedClinicData extends ClinicInput {
  scrapedData?: WebsiteScrapingResult;
  verifiedServices?: ScrapedService[];
}

export async function generateEnhancedSeoContent(
  clinic: EnhancedClinicData,
  scrapedData: WebsiteScrapingResult
): Promise<string> {
  // Filter high-confidence services (>0.7 confidence)
  const verifiedServices = scrapedData.services.filter(s => s.confidence > 0.7);
  
  // Group services by category for better content structure
  const servicesByCategory = groupServicesByCategory(verifiedServices);
  
  // Generate content with Claude using detailed service data
  if (process.env.CLAUDE_API_KEY) {
    try {
      return await generateWithClaude(clinic, servicesByCategory, scrapedData);
    } catch (error) {
      console.error('Enhanced content generation failed:', error);
      throw error;
    }
  }
  
  throw new Error('ENHANCED_SEO_GENERATION_FAILED: Claude API key required');
}

function groupServicesByCategory(services: ScrapedService[]): Map<string, ScrapedService[]> {
  const grouped = new Map<string, ScrapedService[]>();
  
  services.forEach(service => {
    const category = service.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(service);
  });
  
  return grouped;
}

async function generateWithClaude(
  clinic: EnhancedClinicData,
  servicesByCategory: Map<string, ScrapedService[]>,
  scrapedData: WebsiteScrapingResult
): Promise<string> {
  // Build detailed service descriptions
  const serviceDetails = buildServiceDetails(servicesByCategory);
  
  // Extract unique value propositions
  const specializations = scrapedData.additionalInfo?.specializations || [];
  const acceptsInsurance = scrapedData.additionalInfo?.acceptsInsurance || false;
  const hasFinancing = scrapedData.additionalInfo?.hasFinancing || false;
  
  const prompt = `You are an expert medical copywriter creating SEO-optimized content for men's health clinics. 

Generate a comprehensive 700-1,000 word clinic profile that showcases the ACTUAL services and specializations discovered from their website.

**Clinic Information:**
- Name: ${clinic.name}
- Location: ${clinic.city}, ${clinic.state}
- Website: ${clinic.website}

**Verified Services Offered (from website scraping):**
${serviceDetails}

**Special Features:**
- Specializations: ${specializations.join(', ') || 'General men\'s health'}
- Insurance: ${acceptsInsurance ? 'Accepts insurance' : 'Self-pay options available'}
- Financing: ${hasFinancing ? 'Offers financing plans' : 'Various payment options'}

**Content Requirements:**
1. **Opening (100-150 words)**: Introduce ${clinic.name} as a specialized men's health clinic in ${clinic.city}, emphasizing their unique combination of services

2. **Core Services Section (400-500 words)**: 
   - Create dedicated paragraphs for each major service category
   - Use specific service names and treatments found on their website
   - Include technical details that demonstrate expertise
   - Mention specific treatments, therapies, or protocols they offer

3. **What Sets Them Apart (150-200 words)**:
   - Highlight unique services or combinations not commonly found
   - Emphasize any specialized equipment or techniques mentioned
   - Include insurance/financing options if available

4. **Local Excellence (100-150 words)**:
   - Connect their services to ${clinic.city} area needs
   - Mention convenience for surrounding areas
   - Professional yet locally accessible tone

5. **Next Steps (50-100 words)**:
   - Clear call-to-action
   - Mention consultation process if discovered

**IMPORTANT GUIDELINES:**
- Use ACTUAL service names from their website (not generic terms)
- Include specific treatment protocols or brand names found
- Maintain medical accuracy while being accessible
- Natural keyword integration using discovered services
- Write as if you're their expert medical writer
- Output in clean HTML with proper tags (h2, h3, p, ul)
- NO fluff - every sentence should add value
- Include rich, specific details that only come from real research

The content should read like it was written by someone intimately familiar with the clinic's offerings, not generic template content.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.content[0].text;
    
  } catch (error) {
    console.error('Claude API request failed:', error);
    throw error;
  }
}

function buildServiceDetails(servicesByCategory: Map<string, ScrapedService[]>): string {
  let details = '';
  
  // Prioritize categories by importance
  const priorityOrder = [
    'TRT', 'ED Treatment', 'Weight Loss', 'Peptide Therapy', 
    'Hair Restoration', 'HGH', 'Sexual Health', 'Wellness'
  ];
  
  // First add priority services
  priorityOrder.forEach(category => {
    const services = servicesByCategory.get(category);
    if (services && services.length > 0) {
      details += `\n**${category}:**\n`;
      services.forEach(service => {
        details += `- Found on website: "${service.context || service.service}"\n`;
        if (service.price) {
          details += `  - Pricing: ${service.price}\n`;
        }
        if (service.details && service.details.length > 0) {
          details += `  - Details: ${service.details.join(', ')}\n`;
        }
      });
    }
  });
  
  // Then add any remaining categories
  servicesByCategory.forEach((services, category) => {
    if (!priorityOrder.includes(category) && services.length > 0) {
      details += `\n**${category}:**\n`;
      services.forEach(service => {
        details += `- ${service.context || service.service}\n`;
      });
    }
  });
  
  return details || '**Note: Limited service information available from website**';
}

/**
 * Generate comprehensive FAQ based on discovered services
 */
export function generateServiceBasedFAQs(
  clinic: EnhancedClinicData,
  services: ScrapedService[]
): Array<{question: string; answer: string}> {
  const faqs: Array<{question: string; answer: string}> = [];
  
  // General clinic FAQ
  faqs.push({
    question: `What men's health services does ${clinic.name} offer in ${clinic.city}?`,
    answer: `${clinic.name} specializes in comprehensive men's health services including ${services.slice(0, 5).map(s => s.service).join(', ')}. Our ${clinic.city} clinic provides personalized treatment plans designed to help men optimize their health and vitality.`
  });
  
  // Service-specific FAQs
  const trtService = services.find(s => s.category === 'TRT');
  if (trtService) {
    faqs.push({
      question: 'How do I know if I need testosterone replacement therapy?',
      answer: `Common signs of low testosterone include fatigue, decreased libido, weight gain, and mood changes. ${clinic.name} offers comprehensive hormone testing to determine if TRT is right for you. Our specialists will review your symptoms, medical history, and lab results to create a personalized treatment plan.`
    });
  }
  
  const edService = services.find(s => s.category === 'ED Treatment');
  if (edService) {
    faqs.push({
      question: 'What ED treatments are available beyond medication?',
      answer: `${clinic.name} offers advanced ED treatments including ${edService.context || 'multiple therapeutic options'}. These treatments address the root cause of ED and can provide long-lasting results without daily medication.`
    });
  }
  
  const weightLossService = services.find(s => s.category === 'Weight Loss');
  if (weightLossService) {
    faqs.push({
      question: 'What makes medical weight loss different from regular dieting?',
      answer: `Medical weight loss at ${clinic.name} combines physician supervision, prescription medications when appropriate, and personalized nutrition plans. ${weightLossService.context ? `We offer ${weightLossService.context}` : 'Our programs are tailored to male metabolism and hormones for optimal results.'}`
    });
  }
  
  // Insurance/Payment FAQ
  if (clinic.scrapedData?.additionalInfo?.acceptsInsurance) {
    faqs.push({
      question: `Does ${clinic.name} accept insurance?`,
      answer: `Yes, we work with many insurance providers for covered services. Our team can verify your benefits and explain coverage options during your consultation. We also offer self-pay options and financing for treatments not covered by insurance.`
    });
  }
  
  // Location/Service Area FAQ
  faqs.push({
    question: `What areas does ${clinic.name} serve?`,
    answer: `We're conveniently located in ${clinic.city} and serve patients throughout ${clinic.state}. Many patients travel from surrounding areas for our specialized men's health services. We also offer telemedicine consultations for established patients when appropriate.`
  });
  
  return faqs;
}