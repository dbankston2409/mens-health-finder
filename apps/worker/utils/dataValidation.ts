/**
 * Data validation utilities for ensuring data quality before Firestore writes
 */

import { Clinic, ClinicInput } from '../types/clinic';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  sanitizedData?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

/**
 * Validate clinic data before saving to Firestore
 */
export function validateClinicData(data: Partial<ClinicInput>): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const sanitizedData = { ...data };

  // Required fields validation
  if (!data.name || data.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Clinic name is required' });
  } else {
    sanitizedData.name = data.name.trim();
    if (sanitizedData.name.length < 3) {
      errors.push({ field: 'name', message: 'Clinic name must be at least 3 characters' });
    }
    if (sanitizedData.name.length > 100) {
      errors.push({ field: 'name', message: 'Clinic name must be less than 100 characters' });
    }
  }

  // Address validation
  if (!data.address || data.address.trim().length === 0) {
    errors.push({ field: 'address', message: 'Address is required' });
  } else {
    sanitizedData.address = data.address.trim();
  }

  if (!data.city || data.city.trim().length === 0) {
    errors.push({ field: 'city', message: 'City is required' });
  } else {
    sanitizedData.city = data.city.trim();
  }

  if (!data.state || data.state.trim().length === 0) {
    errors.push({ field: 'state', message: 'State is required' });
  } else {
    sanitizedData.state = data.state.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(sanitizedData.state)) {
      errors.push({ field: 'state', message: 'State must be a 2-letter code' });
    }
  }

  // Phone validation
  if (data.phone) {
    const cleanPhone = data.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      errors.push({ 
        field: 'phone', 
        message: 'Phone number must be 10 digits',
        value: data.phone 
      });
    } else {
      sanitizedData.phone = formatPhoneNumber(cleanPhone);
    }
  } else {
    warnings.push({ 
      field: 'phone', 
      message: 'No phone number provided',
      suggestion: 'Consider adding a phone number for better visibility' 
    });
  }

  // Website validation
  if (data.website) {
    try {
      const url = new URL(data.website);
      sanitizedData.website = url.toString();
      
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.push({ 
          field: 'website', 
          message: 'Website must use http or https protocol' 
        });
      }
    } catch {
      errors.push({ 
        field: 'website', 
        message: 'Invalid website URL',
        value: data.website 
      });
    }
  } else {
    warnings.push({ 
      field: 'website', 
      message: 'No website provided',
      suggestion: 'A website is required for scraping and enrichment' 
    });
  }

  // Services validation
  if (data.services && Array.isArray(data.services)) {
    sanitizedData.services = data.services
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (sanitizedData.services.length === 0) {
      warnings.push({ 
        field: 'services', 
        message: 'No valid services provided',
        suggestion: 'Services will be detected during website scraping' 
      });
    }
  }

  // Coordinates validation
  if (data.lat !== undefined || data.lng !== undefined) {
    if (typeof data.lat !== 'number' || typeof data.lng !== 'number') {
      errors.push({ 
        field: 'coordinates', 
        message: 'Both lat and lng must be numbers' 
      });
    } else if (data.lat < -90 || data.lat > 90) {
      errors.push({ 
        field: 'lat', 
        message: 'Latitude must be between -90 and 90',
        value: data.lat 
      });
    } else if (data.lng < -180 || data.lng > 180) {
      errors.push({ 
        field: 'lng', 
        message: 'Longitude must be between -180 and 180',
        value: data.lng 
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: errors.length === 0 ? sanitizedData : undefined
  };
}

/**
 * Validate scraped service data
 */
export function validateScrapedServices(services: any[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const validServices: any[] = [];

  if (!Array.isArray(services)) {
    errors.push({ 
      field: 'services', 
      message: 'Services must be an array' 
    });
    return { isValid: false, errors, warnings };
  }

  services.forEach((service, index) => {
    if (!service.name && !service.service) {
      warnings.push({ 
        field: `services[${index}]`, 
        message: 'Service missing name' 
      });
      return;
    }

    const validService: any = {
      name: (service.name || service.service || '').trim(),
      category: service.category || 'uncategorized',
      confidence: typeof service.confidence === 'number' ? 
        Math.min(1, Math.max(0, service.confidence)) : 0.5
    };

    if (validService.name.length > 0) {
      validServices.push(validService);
    }
  });

  return {
    isValid: true,
    errors,
    warnings,
    sanitizedData: validServices
  };
}

/**
 * Validate SEO content before saving
 */
export function validateSeoContent(content: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!content || typeof content !== 'string') {
    errors.push({ 
      field: 'content', 
      message: 'SEO content must be a non-empty string' 
    });
    return { isValid: false, errors, warnings };
  }

  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  
  if (wordCount < 300) {
    errors.push({ 
      field: 'content', 
      message: `SEO content too short (${wordCount} words). Minimum 300 words required.` 
    });
  }

  if (wordCount > 2000) {
    warnings.push({ 
      field: 'content', 
      message: `SEO content very long (${wordCount} words)`,
      suggestion: 'Consider breaking into multiple pages' 
    });
  }

  // Check for suspicious content patterns
  const suspiciousPatterns = [
    /\b(viagra|cialis)\b/gi,
    /\b(casino|gambling|poker)\b/gi,
    /\b(loan|mortgage|credit)\b/gi,
  ];

  const hasSuspiciousContent = suspiciousPatterns.some(pattern => pattern.test(content));
  if (hasSuspiciousContent) {
    warnings.push({ 
      field: 'content', 
      message: 'Content contains potentially suspicious keywords',
      suggestion: 'Review content for relevance to men\'s health services' 
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedData: errors.length === 0 ? content.trim() : undefined
  };
}

/**
 * Format phone number to standard format
 */
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Validate before any Firestore write operation
 */
export function validateBeforeWrite(
  collection: string,
  data: any
): ValidationResult {
  switch (collection) {
    case 'clinics':
      return validateClinicData(data);
    
    case 'seo_content':
      return validateSeoContent(data.content || data);
    
    case 'verified_services':
      return validateScrapedServices(data);
    
    default:
      // Generic validation
      if (!data || typeof data !== 'object') {
        return {
          isValid: false,
          errors: [{ field: 'data', message: 'Data must be an object' }],
          warnings: []
        };
      }
      return { isValid: true, errors: [], warnings: [] };
  }
}