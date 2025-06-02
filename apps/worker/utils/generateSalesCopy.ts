import { db } from '../lib/firebase';
import { doc, getDoc } from '../lib/firebase-compat';

export interface SalesCopyInput {
  clinicName: string;
  city?: string;
  state?: string;
  services?: string[];
  engagementLevel: 'none' | 'low' | 'engaged';
  currentTier: string;
  suggestedTier?: string;
  metrics: {
    clicks30d: number;
    calls30d: number;
    missedCalls?: number;
    missedClicks?: number;
    revenueOpportunity?: number;
    seoScore?: number;
  };
  painPoints?: string[];
  campaignType: 'upgrade' | 'feature_upsell' | 'retention' | 'reactivation' | 'new_feature';
}

export interface SalesCopyOutput {
  subject: string;
  body: string;
  cta: string;
  personalizations: Record<string, string>;
  tone: 'professional' | 'friendly' | 'urgent' | 'consultative';
  urgency: 'low' | 'medium' | 'high';
}

export async function generateSalesCopy(input: SalesCopyInput): Promise<SalesCopyOutput> {
  try {
    // For now, use template-based generation
    // In production, this would integrate with OpenAI GPT or Anthropic Claude
    const copy = await generateTemplatedCopy(input);
    
    // Log generation for analytics
    console.log(`📝 Generated sales copy for ${input.clinicName} (${input.campaignType})`);
    
    return copy;
    
  } catch (error) {
    console.error('Error generating sales copy:', error);
    throw error;
  }
}

async function generateTemplatedCopy(input: SalesCopyInput): Promise<SalesCopyOutput> {
  const {
    clinicName,
    city,
    state,
    currentTier,
    suggestedTier,
    metrics,
    campaignType,
    engagementLevel
  } = input;
  
  const location = city && state ? `${city}, ${state}` : (city || state || 'your area');
  const revenueAmount = metrics.revenueOpportunity || 0;
  const missedOpportunity = (metrics.missedCalls || 0) + (metrics.missedClicks || 0);
  
  let subject: string;
  let body: string;
  let cta: string;
  let tone: SalesCopyOutput['tone'] = 'professional';
  let urgency: SalesCopyOutput['urgency'] = 'medium';
  
  switch (campaignType) {
    case 'upgrade':
      ({ subject, body, cta, tone, urgency } = generateUpgradeCopy(input, location, revenueAmount, missedOpportunity));
      break;
      
    case 'feature_upsell':
      ({ subject, body, cta, tone, urgency } = generateFeatureUpsellCopy(input, location));
      break;
      
    case 'retention':
      ({ subject, body, cta, tone, urgency } = generateRetentionCopy(input, location));
      break;
      
    case 'reactivation':
      ({ subject, body, cta, tone, urgency } = generateReactivationCopy(input, location));
      break;
      
    case 'new_feature':
      ({ subject, body, cta, tone, urgency } = generateNewFeatureCopy(input, location));
      break;
      
    default:
      throw new Error(`Unsupported campaign type: ${campaignType}`);
  }
  
  const personalizations = {
    clinic_name: clinicName,
    location,
    current_tier: currentTier,
    suggested_tier: suggestedTier || 'premium',
    clicks: metrics.clicks30d.toString(),
    calls: metrics.calls30d.toString(),
    revenue_opportunity: revenueAmount.toString(),
    missed_opportunity: missedOpportunity.toString()
  };
  
  return {
    subject,
    body,
    cta,
    personalizations,
    tone,
    urgency
  };
}

function generateUpgradeCopy(
  input: SalesCopyInput,
  location: string,
  revenueAmount: number,
  missedOpportunity: number
) {
  const { clinicName, metrics, currentTier, suggestedTier, engagementLevel } = input;
  
  let subject: string;
  let body: string;
  let urgency: SalesCopyOutput['urgency'] = 'medium';
  
  if (engagementLevel === 'engaged' && revenueAmount > 500) {
    // High-value upgrade opportunity
    subject = `${clinicName}: Capture ${missedOpportunity}+ missed leads this month`;
    urgency = 'high';
    
    body = `Hi ${clinicName} team,

Great news! Your listing in ${location} is performing well with ${metrics.clicks30d} clicks and ${metrics.calls30d} calls in the last 30 days.

However, our analysis shows you're potentially missing ${missedOpportunity} leads per month. With your current engagement level, upgrading to ${suggestedTier} could help you:

✓ Capture missed calls with advanced tracking
✓ Get priority placement in search results  
✓ Access detailed analytics to optimize performance
✓ Potentially recover $${revenueAmount}/month in missed revenue

Your current ${currentTier} plan is holding you back from reaching more patients who need your services.`;
    
  } else if (metrics.clicks30d >= 50) {
    // High traffic, suggest upgrade
    subject = `${clinicName}: Your ${metrics.clicks30d} monthly clicks show upgrade potential`;
    
    body = `Hi there,

Your ${clinicName} listing in ${location} is getting solid traffic with ${metrics.clicks30d} clicks last month.

Since you're already attracting patients online, upgrading from ${currentTier} to ${suggestedTier} would help you:

• Track all phone calls and see which marketing works
• Get featured placement to capture even more leads
• Access patient analytics to grow your practice
• Stand out from competitors with premium features

With your current traffic, the upgrade typically pays for itself within the first month.`;
    
  } else {
    // General upgrade pitch
    subject = `${clinicName}: Unlock more patients with Men's Health Finder ${suggestedTier}`;
    
    body = `Hi ${clinicName},

We've been helping men's health clinics in ${location} grow their patient base through our platform.

Your current ${currentTier} listing is a great start, but upgrading to ${suggestedTier} can significantly boost your visibility:

• Priority placement in search results
• Advanced call tracking and analytics
• Enhanced profile features and patient reviews
• Dedicated support to optimize your listing

Many clinics see a 40-60% increase in qualified leads within their first month of upgrading.`;
  }
  
  const cta = `Ready to grow your practice? Upgrade to ${suggestedTier} today`;
  
  return {
    subject,
    body,
    cta,
    tone: 'consultative' as const,
    urgency
  };
}

function generateFeatureUpsellCopy(input: SalesCopyInput, location: string) {
  const { clinicName, metrics } = input;
  
  const subject = `${clinicName}: New call tracking feature available`;
  
  const body = `Hi ${clinicName} team,

We've just launched advanced call tracking for clinics in ${location}!

Since your listing generated ${metrics.clicks30d} clicks last month, adding call tracking could help you:

• See exactly which marketing channels drive phone calls
• Track ROI on your Men's Health Finder listing
• Identify peak calling times to optimize staffing
• Never miss a potential patient again

This feature is now available as an add-on to your current plan for just $49/month.

Many of our clinics report capturing 20-30% more leads once they start tracking calls properly.`;
  
  const cta = 'Add call tracking to your listing';
  
  return {
    subject,
    body,
    cta,
    tone: 'friendly' as const,
    urgency: 'low' as const
  };
}

function generateRetentionCopy(input: SalesCopyInput, location: string) {
  const { clinicName, metrics } = input;
  
  const subject = `${clinicName}: Don't lose momentum - your listing is working`;
  
  const body = `Hi ${clinicName},

We noticed your Men's Health Finder listing has been generating results in ${location} with ${metrics.clicks30d} clicks and ${metrics.calls30d} calls recently.

We'd hate to see you lose this momentum! Your current visibility is helping connect you with men who need your services.

Before you consider any changes to your listing, let's chat about:
• How to maximize your current performance
• Recent improvements we've made to help clinics like yours
• Options that might better fit your current needs

We're here to help you succeed and want to make sure you're getting the most value from our platform.`;
  
  const cta = 'Schedule a quick call to discuss your goals';
  
  return {
    subject,
    body,
    cta,
    tone: 'consultative' as const,
    urgency: 'medium' as const
  };
}

function generateReactivationCopy(input: SalesCopyInput, location: string) {
  const { clinicName } = input;
  
  const subject = `${clinicName}: We miss you - special offer to return`;
  
  const body = `Hi ${clinicName} team,

We miss having you as part of the Men's Health Finder community in ${location}!

Since you left, we've made significant improvements:
• Enhanced search visibility for men's health services
• Better local targeting to reach patients in your area  
• Improved analytics and lead tracking tools
• New features to help clinics grow their practice

We'd love to welcome you back with a special offer: 50% off your first 3 months when you rejoin.

Many men in ${location} are still searching for quality men's health care. Let's help them find you again.`;
  
  const cta = 'Rejoin with 50% off - limited time offer';
  
  return {
    subject,
    body,
    cta,
    tone: 'friendly' as const,
    urgency: 'high' as const
  };
}

function generateNewFeatureCopy(input: SalesCopyInput, location: string) {
  const { clinicName, currentTier } = input;
  
  const subject = `${clinicName}: New patient review system now available`;
  
  const body = `Hi ${clinicName},

Exciting news! We've just launched our new patient review and reputation management system for clinics in ${location}.

This new feature helps you:
• Automatically request reviews from satisfied patients
• Respond to feedback professionally  
• Build trust with potential new patients
• Improve your online reputation across the web

Since you're already on our ${currentTier} plan, you can add this feature for just $29/month.

Clinics using our review system typically see a 25% increase in new patient inquiries within 60 days.`;
  
  const cta = 'Add review management to your plan';
  
  return {
    subject,
    body,
    cta,
    tone: 'professional' as const,
    urgency: 'low' as const
  };
}

// AI-powered copy generation (for future integration)
export async function generateAICopy(input: SalesCopyInput): Promise<SalesCopyOutput> {
  // This would integrate with OpenAI GPT or Anthropic Claude
  // For now, fall back to template-based generation
  
  const prompt = buildAIPrompt(input);
  
  // In production:
  /*
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an expert sales copywriter for healthcare technology platforms..."
      },
      {
        role: "user", 
        content: prompt
      }
    ],
    max_tokens: 500,
    temperature: 0.7
  });
  
  return parseAIResponse(response.choices[0].message.content);
  */
  
  // Fallback to template-based generation
  return generateTemplatedCopy(input);
}

function buildAIPrompt(input: SalesCopyInput): string {
  return `
Generate sales copy for a men's health clinic outreach campaign:

Clinic: ${input.clinicName}
Location: ${input.city}, ${input.state}
Current Plan: ${input.currentTier}
Campaign Type: ${input.campaignType}
Engagement Level: ${input.engagementLevel}

Recent Performance:
- ${input.metrics.clicks30d} clicks in 30 days
- ${input.metrics.calls30d} calls in 30 days
- ${input.metrics.missedCalls || 0} missed call opportunities
- $${input.metrics.revenueOpportunity || 0} potential monthly revenue

Pain Points: ${input.painPoints?.join(', ') || 'None specified'}

Please provide:
1. Email subject line (under 60 characters)
2. Email body (200-300 words, professional but conversational)
3. Clear call-to-action
4. Tone assessment (professional/friendly/urgent/consultative)

Focus on specific metrics and local relevance. Avoid generic language.
  `;
}

export function validateSalesCopy(copy: SalesCopyOutput): boolean {
  // Validate generated copy meets quality standards
  if (!copy.subject || copy.subject.length > 100) return false;
  if (!copy.body || copy.body.length < 100 || copy.body.length > 2000) return false;
  if (!copy.cta || copy.cta.length > 100) return false;
  
  // Check for spam-like content
  const spamWords = ['guaranteed', 'free money', '100% free', 'click here now', 'limited time only'];
  const content = (copy.subject + ' ' + copy.body).toLowerCase();
  
  for (const spamWord of spamWords) {
    if (content.includes(spamWord)) return false;
  }
  
  return true;
}