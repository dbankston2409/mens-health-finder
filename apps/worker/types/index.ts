export interface Clinic {
  id?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  phone: string;
  website?: string;
  services?: string[];
  tier?: 'free' | 'standard' | 'advanced';
  status?: string;
  slug?: string;
  lat?: number;
  lng?: number;
  tags?: string[];
  seoMeta?: SeoMeta;
  createdAt?: any;
  updatedAt?: any;
}

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string[];
  indexed?: boolean;
}