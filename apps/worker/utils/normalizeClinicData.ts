import { RawClinic, ClinicInput } from '../types/clinic';
import { formatPhoneNumber } from './formatPhoneNumber';

export function normalizeClinicData(raw: RawClinic): ClinicInput {
  // Extract and normalize basic fields
  const name = (raw.name || '').trim();
  const address = (raw.address || '').trim();
  const city = (raw.city || '').trim();
  const state = (raw.state || '').trim().toUpperCase();
  const zip = (raw.zip || '').trim();
  const website = normalizeWebsite(raw.website || '');
  
  // Parse services
  const services = parseServices(raw.services || '');
  
  // Normalize phone
  const phone = formatPhoneNumber(raw.phone || '');
  
  // Set package (default to basic)
  const packageLevel = normalizePackage(raw.package);
  
  // Set status (default to active)
  const status = normalizeStatus(raw.status);
  
  // Initialize tags array
  const tags: string[] = [];
  
  // Validation - add tags for missing required fields
  if (!name) tags.push('missing-name');
  if (!address || !city || !state) tags.push('incomplete-address');
  if (!phone || phone === 'invalid') tags.push('invalid-phone');
  if (!website) tags.push('missing-website');
  if (services.length === 0) tags.push('missing-services');
  
  const now = new Date();
  
  return {
    name,
    address,
    city,
    state,
    zip,
    phone,
    website,
    services,
    package: packageLevel,
    status: tags.length > 0 ? 'paused' : status, // Pause if validation issues
    tags,
    createdAt: now,
    updatedAt: now
  };
}

function normalizeWebsite(website: string): string {
  if (!website || website.trim() === '') return '';
  
  website = website.trim().toLowerCase();
  
  // Add protocol if missing
  if (!website.startsWith('http://') && !website.startsWith('https://')) {
    website = 'https://' + website;
  }
  
  return website;
}

function parseServices(servicesStr: string): string[] {
  if (!servicesStr || servicesStr.trim() === '') {
    return [];
  }
  
  // Split by common delimiters and clean up
  const services = servicesStr
    .split(/[,;|]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .map(s => {
      // Normalize common service names
      const normalized = s.toLowerCase();
      if (normalized.includes('trt') || normalized.includes('testosterone')) return 'TRT';
      if (normalized.includes('ed') || normalized.includes('erectile')) return 'ED Treatment';
      if (normalized.includes('weight') || normalized.includes('loss')) return 'Weight Loss';
      if (normalized.includes('hair') || normalized.includes('restoration')) return 'Hair Restoration';
      if (normalized.includes('hormone')) return 'Hormone Therapy';
      if (normalized.includes('wellness') || normalized.includes('health')) return 'Wellness';
      return s; // Return original if no match
    });
  
  // Remove duplicates
  return [...new Set(services)];
}

function normalizePackage(pkg?: string): 'free' | 'basic' | 'premium' {
  if (!pkg) return 'basic';
  
  const normalized = pkg.toLowerCase().trim();
  if (normalized === 'free' || normalized === 'trial') return 'free';
  if (normalized === 'premium' || normalized === 'high' || normalized === 'pro') return 'premium';
  return 'basic';
}

function normalizeStatus(status?: string): 'active' | 'paused' | 'inactive' {
  if (!status) return 'active';
  
  const normalized = status.toLowerCase().trim();
  if (normalized === 'paused' || normalized === 'pending') return 'paused';
  if (normalized === 'inactive' || normalized === 'disabled') return 'inactive';
  return 'active';
}