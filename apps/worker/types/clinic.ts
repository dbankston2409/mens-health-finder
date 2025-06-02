// Core types for the clinic import system

export interface RawClinic {
  [key: string]: string | undefined;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string;
  website?: string;
  services?: string;
  package?: string;
  status?: string;
}

export interface ClinicInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  website: string;
  services: string[];
  package: 'free' | 'basic' | 'premium';
  status: 'active' | 'paused' | 'inactive';
  tags: string[];
  lat?: number;
  lng?: number;
  slug?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  geoAccuracy: 'exact' | 'approximate' | 'failed';
}

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
  indexed: boolean;
  lastIndexed?: Date;
  lastGenerated?: Date;
}

export interface ClinicDocument extends ClinicInput {
  slug: string;
  lat: number;
  lng: number;
  seoMeta: SeoMeta;
  seoContent: string;
}

export interface ImportResult {
  totalProcessed: number;
  totalImported: number;
  totalUpdated: number;
  totalFailed: number;
  errors: ImportError[];
  successfulSlugs: string[];
  duration: number;
}

export interface ImportError {
  type: string;
  message: string;
  data?: any;
  count: number;
}

// Export Clinic as alias for ClinicDocument for compatibility
export type Clinic = ClinicDocument;