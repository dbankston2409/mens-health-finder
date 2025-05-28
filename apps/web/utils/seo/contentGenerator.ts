import { db } from '../../lib/firebase';
import { doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { Clinic } from '../../lib/api/clinicService';

/**
 * Generates SEO-optimized content for a clinic
 * Using a template-based approach (in production, this would call Claude API)
 * 
 * @param clinic - The clinic data
 * @returns - Generated HTML content block
 */
export async function generateSeoContent(clinic: Clinic): Promise<string> {
  try {
    // Prevent Firebase operations in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Running in development mode - using mock SEO content');
      return generateContentTemplate(clinic);
    }
    
    // In production, you might call an API here
    return generateContentTemplate(clinic);
  } catch (error) {
    console.error('Error generating SEO content:', error);
    // Fallback to basic content
    return `
      <article class="seo-content prose prose-invert max-w-none">
        <p class="mb-4">${clinic.name} is a men's health clinic located in ${clinic.city}, ${clinic.state}.</p>
      </article>
    `;
  }
}

/**
 * Generate content from template (shared between dev/prod)
 */
function generateContentTemplate(clinic: Clinic): string {
  const { name, city, state, services, website } = clinic;
  
  // Extract primary services (up to 3)
  const primaryServices = (services || []).slice(0, 3);
  const primaryServiceText = primaryServices.join(', ');
  
  // Format clinic name for display
  const clinicName = name.replace(/'/g, "'");
  
  // Generate content sections
  const introduction = `
    <p class="mb-4">
      ${clinicName} is a leading provider of ${primaryServiceText} and comprehensive men's health services in ${city}, ${state}. 
      Our clinic specializes in personalized treatments designed to help men achieve optimal health and wellness at every age.
    </p>
  `;
  
  // Service descriptions
  const servicesContent = `
    <h3 class="text-xl font-semibold mb-3">Specialized Men's Health Services</h3>
    <p class="mb-4">
      At ${clinicName}, we offer a range of specialized services tailored to men's unique health needs. Our medical professionals
      have extensive experience in ${primaryServiceText} and related therapies.
    </p>
    <ul class="list-disc pl-6 mb-4 space-y-2">
      ${(services || []).map(service => `<li>${service}</li>`).join('')}
    </ul>
  `;
  
  // Benefits section
  const benefitsContent = `
    <h3 class="text-xl font-semibold mb-3">Benefits of Treatment at ${clinicName}</h3>
    <p class="mb-4">
      Our patients in ${city} choose ${clinicName} for our personalized approach and commitment to men's health. When you visit our clinic, you can expect:
    </p>
    <ul class="list-disc pl-6 mb-4 space-y-2">
      <li>Personalized treatment plans tailored to your specific health needs</li>
      <li>Experienced medical professionals specializing in men's health</li>
      <li>Comprehensive care with ongoing monitoring and support</li>
      <li>Convenient location in ${city}, ${state} with flexible scheduling options</li>
    </ul>
  `;
  
  // Call to action
  const ctaContent = `
    <p class="mb-4">
      If you're looking for ${primaryServices[0] || 'men\'s health services'} or other men's health services in ${city}, contact ${clinicName} today to schedule a consultation.
      Our team is ready to help you achieve your health and wellness goals.
    </p>
    ${website ? `<p class="mb-4">For more information about our services, visit our website at <a href="${website}" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">${website.replace(/^https?:\/\//, '')}</a>.</p>` : ''}
  `;
  
  // Assemble the full content block
  const fullContent = `
    <article class="seo-content prose prose-invert max-w-none">
      ${introduction}
      ${servicesContent}
      ${benefitsContent}
      ${ctaContent}
    </article>
  `;
  
  return fullContent.trim();
}

/**
 * Stores SEO content for a clinic in Firestore
 * 
 * @param clinicId - The clinic's document ID
 * @param content - The SEO content to store
 * @returns - Result of the update operation
 */
export async function storeSeoContent(clinicId: string, content: string): Promise<boolean> {
  // Skip Firebase operations in development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MOCK] Storing SEO content for clinic ${clinicId} - ${content.substring(0, 50)}...`);
    return true;
  }
  
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    
    await updateDoc(clinicRef, {
      'seoContent': content,
      'lastUpdated': Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error storing SEO content:', error);
    return false;
  }
}

/**
 * Generates and stores SEO content for a clinic
 * 
 * @param clinicId - The clinic's document ID
 * @returns - Result of the operation
 */
export async function generateAndStoreSeoContent(clinicId: string): Promise<boolean> {
  // Handle development mode
  if (process.env.NODE_ENV === 'development') {
    // In development mode, just simulate success
    console.log(`[MOCK] Generated and stored SEO content for clinic ${clinicId}`);
    return true;
  }
  
  try {
    const clinicRef = doc(db, 'clinics', clinicId);
    const clinicDoc = await getDoc(clinicRef);
    
    if (!clinicDoc.exists()) {
      return false;
    }
    
    const clinicData = clinicDoc.data() as Clinic;
    clinicData.id = clinicId;
    
    const seoContent = await generateSeoContent(clinicData);
    return storeSeoContent(clinicId, seoContent);
  } catch (error) {
    console.error('Error generating and storing SEO content:', error);
    return false;
  }
}

/**
 * Batch generates SEO content for multiple clinics
 * 
 * @param clinicIds - Array of clinic IDs to process
 * @returns - Number of successfully processed clinics
 */
export async function batchGenerateSeoContent(clinicIds: string[]): Promise<number> {
  // Handle development mode
  if (process.env.NODE_ENV === 'development') {
    console.log(`[MOCK] Batch generated SEO content for ${clinicIds.length} clinics`);
    return clinicIds.length;
  }
  
  let successCount = 0;
  
  for (const clinicId of clinicIds) {
    try {
      const success = await generateAndStoreSeoContent(clinicId);
      if (success) {
        successCount++;
      }
    } catch (error) {
      console.error(`Error processing clinic ${clinicId}:`, error);
    }
  }
  
  return successCount;
}