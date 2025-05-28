import { ClinicInput, SeoMeta } from '../types/clinic';
import fetch from 'node-fetch';

export async function generateSeoMeta(clinic: ClinicInput): Promise<SeoMeta> {
  // If OpenAI API is available, use it for dynamic generation
  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateSeoMetaWithOpenAI(clinic);
    } catch (error) {
      console.warn('OpenAI SEO generation failed, using template-based approach:', error);
    }
  }
  
  // Fallback to template-based generation
  return generateSeoMetaTemplate(clinic);
}

async function generateSeoMetaWithOpenAI(clinic: ClinicInput): Promise<SeoMeta> {
  const prompt = `Generate SEO metadata for a men's health clinic with the following details:

Name: ${clinic.name}
City: ${clinic.city}, ${clinic.state}
Services: ${clinic.services.join(', ')}

Generate:
1. A compelling SEO title (max 60 characters) that includes the clinic name, primary service, and location
2. A persuasive meta description (max 160 characters) that encourages visits and calls
3. 8-10 relevant keywords for local SEO

Focus on men's health, testosterone therapy, ED treatment, and local search terms.

Respond in JSON format:
{
  "title": "...",
  "description": "...",
  "keywords": ["keyword1", "keyword2", ...]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO copywriter specializing in healthcare and local business optimization.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json() as any;
  const content = data.choices[0].message.content;
  
  try {
    const parsed = JSON.parse(content);
    return {
      title: parsed.title.substring(0, 60),
      description: parsed.description.substring(0, 160),
      keywords: parsed.keywords.slice(0, 10),
      indexed: false
    };
  } catch (parseError) {
    throw new Error('Failed to parse OpenAI response');
  }
}

function generateSeoMetaTemplate(clinic: ClinicInput): SeoMeta {
  // Generate title (max 60 chars)
  const primaryService = clinic.services[0] || 'Men\'s Health';
  const title = `${clinic.name} - ${primaryService} in ${clinic.city}, ${clinic.state}`
    .substring(0, 60)
    .replace(/,\s*$/, ''); // Remove trailing comma if any

  // Generate description (max 160 chars)
  const servicesText = clinic.services.slice(0, 3).join(', ');
  const description = `Leading men's health clinic in ${clinic.city}, ${clinic.state}. Specializing in ${servicesText}. Call today for consultation and treatment.`
    .substring(0, 160);

  // Generate keywords
  const keywords = generateKeywords(clinic);

  return {
    title,
    description,
    keywords,
    indexed: false
  };
}

function generateKeywords(clinic: ClinicInput): string[] {
  const keywords: string[] = [];
  
  // Location-based keywords
  keywords.push(`${clinic.city} men's health`);
  keywords.push(`${clinic.city} ${clinic.state} men's clinic`);
  keywords.push(`men's health ${clinic.city}`);
  
  // Service-based keywords
  clinic.services.forEach(service => {
    keywords.push(`${service.toLowerCase()} ${clinic.city}`);
    keywords.push(`${service.toLowerCase()} clinic ${clinic.state}`);
  });
  
  // General men's health keywords
  keywords.push('testosterone therapy');
  keywords.push('ED treatment');
  keywords.push('men\'s wellness');
  keywords.push('hormone replacement');
  keywords.push('low testosterone');
  
  // Brand keywords
  keywords.push(clinic.name.toLowerCase());
  
  // Remove duplicates and limit to 10
  return [...new Set(keywords)].slice(0, 10);
}