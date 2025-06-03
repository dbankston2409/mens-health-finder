import { ClinicInput } from '../types/clinic';
import fetch from 'node-fetch';

export async function generateSeoContent(clinic: ClinicInput): Promise<string> {
  // If Claude API is available, use it for dynamic generation
  if (process.env.CLAUDE_API_KEY) {
    try {
      return await generateSeoContentWithClaude(clinic);
    } catch (error) {
      console.error('Claude SEO content generation failed:', error);
      // Mark clinic for manual review instead of using fallback
      throw new Error(`SEO_CONTENT_GENERATION_FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // No API key available - mark for manual review
  throw new Error('SEO_CONTENT_GENERATION_FAILED: Claude API key not configured');
}

async function generateSeoContentWithClaude(clinic: ClinicInput): Promise<string> {
  const prompt = `You are a highly skilled professional copywriter specializing in local SEO for healthcare clinics. Your task is to generate a 500–700 word clinic profile page for MHF (Men's Health Finder), a national men's health directory.

Write the content as if it's going live on a public-facing SEO page — the kind of content Google rewards and real people trust.

You will receive the following inputs:
- Clinic Name: ${clinic.name}
- City, State: ${clinic.city}, ${clinic.state}
- List of Services: ${clinic.services.join(', ')}

**Output Requirements (VERY IMPORTANT):**
- Word Count: 500–700 words (MUST be at least 500 words — verify before finalizing)
- Tone: Professional, local, and natural — not corporate or robotic
- SEO: Use local and service-related keywords naturally, without stuffing
- Perspective: Third-person (e.g. "At ${clinic.name} in ${clinic.city}, men receive…")
- Structure: Use short paragraphs, subheadings, and logical flow
- No emoji, fluff, or "AI-sounding" content
- Output Format: HTML with proper tags (h2, h3, p, ul/li)

**Structure Guidelines:**

1. **Intro (1 paragraph)**  
   - Mention the clinic name, city/state, and core focus on men's health  
   - Emphasize trusted care, discreet service, and life-improving results

2. **Service Overview Section (2–4 paragraphs)**  
   - Provide detail on each major service offered  
   - Include what the service helps with, how it works, and typical outcomes  
   - Localize descriptions where possible (e.g. "Serving men across the ${clinic.city} area…")

3. **Why Men Choose This Clinic (1–2 paragraphs)**  
   - Highlight competitive differentiators (personalized care, experienced staff, walk-in availability, etc.)  
   - Focus on what men appreciate — clarity, trust, results, privacy

4. **Local Tie-In (1 paragraph)**  
   - Mention community relevance, central location, ease of access, or local reputation  
   - Reference city/state to strengthen local SEO and trust

5. **Call to Action (1 strong closing paragraph)**  
   - Encourage the reader to call, schedule a consult, or explore available services  
   - Keep tone confident and benefit-focused (e.g. "Feel better, perform better — discreetly and professionally.")

**DO NOT:**
- Use hype phrases like "Unlock your potential," "Reclaim your life," "Discover the secret to..."
- Use generic AI filler phrases (e.g. "This clinic offers comprehensive care…" or "They understand your unique needs.")
- Use passive voice excessively
- Repeat phrases unnecessarily
- Include quotes, statistics, or links unless provided
- Use emojis, icons, or listicles

Return the content in HTML format with appropriate heading tags and paragraphs. Do not include any explanations or metadata.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json() as any;
  return data.content[0].text;
}

// Template functions removed - we require AI generation or manual review