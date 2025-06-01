import axios from 'axios';
import { Clinic } from '../../apps/web/types';

/**
 * Generates an AI-powered snapshot description for a clinic based on its details.
 * 
 * @param clinic - The clinic data to generate a snapshot for
 * @returns A promise that resolves to the generated snapshot text
 */
export async function generateClinicSnapshot(clinic: Clinic): Promise<string> {
  try {
    // Check if we have the necessary API key
    const apiKey = process.env.CLAUDE_API_KEY || process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      console.warn('AI snapshot generation not available: Missing API key');
      return generateFallbackSnapshot(clinic);
    }
    
    // Determine which API to use based on available keys
    if (process.env.CLAUDE_API_KEY) {
      return generateWithClaude(clinic);
    } else if (process.env.OPENAI_API_KEY) {
      return generateWithOpenAI(clinic);
    }
    
    return generateFallbackSnapshot(clinic);
  } catch (error) {
    console.error('Error generating clinic snapshot:', error);
    // Fall back to a rule-based snapshot if AI generation fails
    return generateFallbackSnapshot(clinic);
  }
}

/**
 * Generate a snapshot using Anthropic's Claude API
 */
async function generateWithClaude(clinic: Clinic): Promise<string> {
  try {
    const apiKey = process.env.CLAUDE_API_KEY as string;
    
    // Format the prompt with clinic details
    const prompt = createPrompt(clinic);
    
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-3-haiku-20240307',
        max_tokens: 1024,
        messages: [
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        }
      }
    );
    
    // Extract the content from Claude's response
    const snapshot = response.data?.content?.[0]?.text || '';
    
    // Trim and sanitize the response
    return sanitizeSnapshot(snapshot);
  } catch (error) {
    console.error('Error with Claude API:', error);
    throw error;
  }
}

/**
 * Generate a snapshot using OpenAI's API
 */
async function generateWithOpenAI(clinic: Clinic): Promise<string> {
  try {
    const apiKey = process.env.OPENAI_API_KEY as string;
    
    // Format the prompt with clinic details
    const prompt = createPrompt(clinic);
    
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 800,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Extract the content from OpenAI's response
    const snapshot = response.data?.choices?.[0]?.message?.content || '';
    
    // Trim and sanitize the response
    return sanitizeSnapshot(snapshot);
  } catch (error) {
    console.error('Error with OpenAI API:', error);
    throw error;
  }
}

/**
 * Creates a prompt for the AI model based on clinic data
 */
function createPrompt(clinic: Clinic): string {
  // Extract relevant data from clinic
  const {
    name,
    city,
    state,
    services = [],
    tags = [],
    tier = 'free',
    seo
  } = clinic;
  
  // Create a comprehensive prompt for the AI
  return `
Write a compelling 500-800 character (NOT word) snapshot paragraph for a men's health clinic profile. This will appear on the clinic's public profile page.

CLINIC DETAILS:
- Name: ${name}
- Location: ${city}, ${state}
- Services: ${services.join(', ')}
- Tags: ${tags.join(', ')}
- Tier level: ${tier}
${seo?.keywords ? `- SEO Keywords: ${seo.keywords.join(', ')}` : ''}

REQUIREMENTS:
1. Be professional, accurate, and informative
2. Describe what makes this clinic unique for men's health
3. Mention their primary services and specialties
4. Include their location in a natural way
5. Highlight their expertise and approach
6. No marketing language or exaggerated claims
7. Do not mention specific doctors or staff
8. Do not mention prices or insurance
9. Do not use the phrase "men's health"/"men's clinic" more than twice
10. Do not have more than 800 characters (about 120-160 words)
11. Write in third person

OUTPUT ONLY THE SNAPSHOT TEXT with no additional commentary or formatting.`;
}

/**
 * Process and clean up the AI-generated snapshot
 */
function sanitizeSnapshot(rawText: string): string {
  // Remove any quotes or extra whitespace
  let cleaned = rawText
    .replace(/^["']|["']$/g, '')
    .trim();
    
  // Ensure it doesn't exceed 800 characters
  if (cleaned.length > 800) {
    cleaned = cleaned.substring(0, 797) + '...';
  }
  
  return cleaned;
}

/**
 * Generates a rule-based snapshot when AI services are unavailable
 */
function generateFallbackSnapshot(clinic: Clinic): string {
  const {
    name,
    city,
    state,
    services = [],
    tags = []
  } = clinic;
  
  // Create a list of unique services
  const uniqueServices = Array.from(new Set([...services, ...tags]))
    .filter(s => s && s.length > 0)
    .slice(0, 5); // Take up to 5 services/tags
  
  // Create service descriptions
  const serviceList = uniqueServices.length > 0
    ? `specializing in ${uniqueServices.join(', ')}`
    : 'offering comprehensive men\'s health treatments';
    
  // Create a formatted snapshot
  const snapshot = `
${name} is a specialized healthcare provider ${serviceList} in ${city}, ${state}. 
The clinic focuses on addressing men's unique health needs through personalized treatment plans and evidence-based approaches. 
Patients benefit from comprehensive care in a professional, discreet environment designed specifically for men's health concerns. 
With a commitment to improving quality of life, the clinic helps men address health issues and achieve optimal wellness through targeted therapies and treatments.
`.replace(/\s+/g, ' ').trim();
  
  // Ensure length is appropriate
  return snapshot.length > 800 ? snapshot.substring(0, 797) + '...' : snapshot;
}

export default generateClinicSnapshot;