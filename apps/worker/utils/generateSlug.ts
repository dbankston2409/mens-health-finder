import admin from '../lib/firebase';

export async function generateSlug(clinicName: string, city: string, state: string): Promise<string> {
  // Create base slug from clinic name, city, and state
  const baseSlug = createBaseSlug(clinicName, city, state);
  
  // Check if slug already exists in Firestore
  const db = admin.firestore();
  let finalSlug = baseSlug;
  let counter = 1;
  
  while (await slugExists(db, finalSlug)) {
    counter++;
    finalSlug = `${baseSlug}-${counter}`;
    
    // Prevent infinite loops
    if (counter > 100) {
      throw new Error(`Unable to generate unique slug for: ${clinicName}. Too many conflicts.`);
    }
  }
  
  return finalSlug;
}

function createBaseSlug(name: string, city: string, state: string): string {
  // Combine name, city, and state
  const combined = `${name} ${city} ${state}`;
  
  return combined
    .toLowerCase()
    .trim()
    // Remove common business suffixes
    .replace(/\b(llc|inc|corp|corporation|company|co|ltd|limited|clinic|medical|center|health|mens|men's)\b/g, '')
    // Replace special characters and spaces with hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces/hyphens with single hyphen
    .replace(/[\s-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length
    .substring(0, 60)
    // Remove trailing hyphen if any
    .replace(/-+$/, '');
}

async function slugExists(db: FirebaseFirestore.Firestore, slug: string): Promise<boolean> {
  try {
    const doc = await db.collection('clinics').doc(slug).get();
    return doc.exists;
  } catch (error) {
    console.error('Error checking slug existence:', error);
    // In case of error, assume it doesn't exist to avoid blocking
    return false;
  }
}

export function validateSlug(slug: string): boolean {
  // Check if slug meets our requirements
  const slugPattern = /^[a-z0-9-]+$/;
  return (
    slug.length >= 3 &&
    slug.length <= 60 &&
    slugPattern.test(slug) &&
    !slug.startsWith('-') &&
    !slug.endsWith('-') &&
    !slug.includes('--')
  );
}