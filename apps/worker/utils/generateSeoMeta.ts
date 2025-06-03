import { ClinicInput, SeoMeta } from '../types/clinic';
import fetch from 'node-fetch';

export async function generateSeoMeta(clinic: ClinicInput): Promise<SeoMeta> {
  // If OpenAI API is available, use it for dynamic generation
  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateSeoMetaWithOpenAI(clinic);
    } catch (error) {
      console.error('OpenAI SEO generation failed:', error);
      // Mark clinic for manual review instead of using fallback
      throw new Error(`SEO_META_GENERATION_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // No API key available - mark for manual review
  throw new Error('SEO_META_GENERATION_FAILED: OpenAI API key not configured');
}

async function generateSeoMetaWithOpenAI(clinic: ClinicInput): Promise<SeoMeta> {
  const primaryService = clinic.services[0] || 'Men\'s Health';
  
  const prompt = `You are an elite local SEO copywriter writing for a men's health clinic directory (MHF – Men's Health Finder). Your task is to write Google-optimized content that sounds 100% human — not AI-generated.

Input Fields:
- Clinic Name: ${clinic.name}
- Primary Service: ${primaryService}
- Location: ${clinic.city}, ${clinic.state}

Your job is to generate natural, local-first SEO content that gets clicks and inspires trust. Return output in structured JSON format.

Output Format (JSON):
{
  "seo_title": "String (Max 60 characters. Must include clinic name, primary service, and city/state. Clear, scannable, and natural.)",
  "meta_description": "String (Max 160 characters. Persuasive, warm, and specific. Encourage call or booking.)",
  "keywords": ["keyword1", "keyword2", ..., "keyword10"]
}

Voice & Style Rules:
- DO write like a real person in marketing would write for a local clinic.
- DO use natural, confident tone without sounding scripted or robotic.
- DO aim for clarity and trust — not hype or fluff.

Avoid ALL of the following:
- ❌ AI-sounding phrases: "Unlock your potential", "Transform your life", "Discover the benefits", "Take the first step", "Cutting-edge solutions", "Look no further", "Tailored just for you"
- ❌ Vague descriptors: "Comprehensive", "State-of-the-art", "World-class", unless justified with specifics
- ❌ Overpromising or generic cliches: "Best in town", "Like never before", "Feel like yourself again" (unless grounded in local proof)
- ❌ Emojis, exclamation marks, or hype language
- ❌ Passive or overused formats: "Your trusted clinic for XYZ in City"

Positive Examples:
- seo_title: "Men's Vitality Center – TRT & ED Treatment in Tampa, FL"
- meta_description: "Experienced TRT clinic in Tampa. Personalized care, real results. Call today to speak with a local provider."

Bad Examples to Avoid:
- seo_title: "Unlock Your Potential with Testosterone – Book Now!"
- meta_description: "Transform your life with cutting-edge hormone therapy. Discover the benefits of feeling great again!"

Return **ONLY** valid JSON. No comments, explanations, or markdown.`;

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
      title: (parsed.seo_title || parsed.title || '').substring(0, 60),
      description: (parsed.meta_description || parsed.description || '').substring(0, 160),
      keywords: (parsed.keywords || []).slice(0, 10),
      indexed: false
    };
  } catch (parseError) {
    throw new Error('Failed to parse OpenAI response');
  }
}

// Template functions removed - we require AI generation or manual review