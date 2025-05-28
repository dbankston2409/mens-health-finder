import { ClinicInput } from '../types/clinic';
import fetch from 'node-fetch';

export async function generateSeoContent(clinic: ClinicInput): Promise<string> {
  // If Claude API is available, use it for dynamic generation
  if (process.env.CLAUDE_API_KEY) {
    try {
      return await generateSeoContentWithClaude(clinic);
    } catch (error) {
      console.warn('Claude SEO content generation failed, using template-based approach:', error);
    }
  }
  
  // Fallback to template-based generation
  return generateSeoContentTemplate(clinic);
}

async function generateSeoContentWithClaude(clinic: ClinicInput): Promise<string> {
  const prompt = `Write SEO-optimized content for a men's health clinic landing page. Include the following details naturally:

Clinic: ${clinic.name}
Location: ${clinic.city}, ${clinic.state}
Services: ${clinic.services.join(', ')}
${clinic.website ? `Website: ${clinic.website}` : ''}

Requirements:
- 300-500 words
- Professional, human-sounding tone
- SEO-rich but natural language
- Mentions services, city, men's health relevance
- Encourages action (call, visit, explore services)
- Include local relevance
- Focus on patient benefits and outcomes

Write in HTML format with proper heading structure (h2, h3) and paragraphs.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
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

function generateSeoContentTemplate(clinic: ClinicInput): string {
  const servicesText = clinic.services.join(', ');
  const primaryService = clinic.services[0] || 'comprehensive men\'s health services';
  
  return `
<div class="seo-content">
  <h2>Premier Men's Health Care in ${clinic.city}, ${clinic.state}</h2>
  
  <p>Welcome to ${clinic.name}, your trusted partner for comprehensive men's health solutions in ${clinic.city}, ${clinic.state}. Our state-of-the-art facility specializes in ${servicesText}, providing personalized care tailored to your unique health needs.</p>
  
  <h3>Expert ${primaryService} Services</h3>
  
  <p>At ${clinic.name}, we understand that men's health requires specialized attention and expertise. Our experienced medical professionals are dedicated to helping men in ${clinic.city} and throughout ${clinic.state} achieve optimal health and wellness through evidence-based treatments and compassionate care.</p>
  
  ${generateServicesSection(clinic.services)}
  
  <h3>Why Choose ${clinic.name}?</h3>
  
  <p>Our commitment to excellence in men's health care sets us apart in ${clinic.city}. We offer:</p>
  
  <ul>
    <li>Personalized treatment plans tailored to your specific needs</li>
    <li>State-of-the-art medical technology and facilities</li>
    <li>Experienced healthcare professionals specializing in men's health</li>
    <li>Convenient location in ${clinic.city}, ${clinic.state}</li>
    <li>Comprehensive approach to wellness and preventive care</li>
  </ul>
  
  <h3>Schedule Your Consultation Today</h3>
  
  <p>Take the first step toward better health and renewed vitality. Contact ${clinic.name} today to schedule your consultation. Our team is ready to help you achieve your health goals and improve your quality of life.</p>
  
  <p><strong>Ready to get started?</strong> Call us now or visit our clinic in ${clinic.city} to learn more about our comprehensive men's health services.</p>
</div>
  `.trim();
}

function generateServicesSection(services: string[]): string {
  if (services.length === 0) return '';
  
  const serviceDescriptions: { [key: string]: string } = {
    'TRT': 'testosterone replacement therapy to address low testosterone levels and improve energy, mood, and overall well-being',
    'ED Treatment': 'effective erectile dysfunction treatments to restore confidence and intimate relationships',
    'Weight Loss': 'medically supervised weight management programs designed specifically for men',
    'Hair Restoration': 'advanced hair restoration solutions to combat male pattern baldness',
    'Hormone Therapy': 'comprehensive hormone optimization to balance your body\'s natural systems',
    'Wellness': 'holistic wellness programs focusing on preventive care and lifestyle optimization'
  };
  
  let section = '<h3>Our Specialized Services</h3>\n<p>We offer a comprehensive range of men\'s health services, including:</p>\n<ul>\n';
  
  services.forEach(service => {
    const description = serviceDescriptions[service] || `specialized ${service.toLowerCase()} treatments`;
    section += `  <li><strong>${service}:</strong> ${description}</li>\n`;
  });
  
  section += '</ul>\n';
  
  return section;
}