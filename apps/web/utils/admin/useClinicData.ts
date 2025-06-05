import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export interface Clinic {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  // Standardized tier system
  tier?: 'free' | 'standard' | 'advanced';
  // Legacy fields
  package: 'Free' | 'Basic' | 'Premium';
  packageTier?: 'free' | 'basic' | 'premium' | string;
  status: 'Active' | 'Trial' | 'Paused' | 'Canceled';
  joinDate: string;
  lastContact?: string;
  engagementScore?: number;
  salesRep?: string;
  services: string[];
  tags?: string[];
  notes?: string[];
  seoMeta?: {
    title?: string;
    description?: string;
    keywords?: string[];
    indexed?: boolean;
    lastIndexed?: Date | any;
  };
  // Tier-specific features
  tierFeatures?: {
    fullProfile: boolean;
    seoDescription: boolean;
    publicContact: boolean;
    locationMapping: boolean;
    basicSearch: boolean;
    verifiedBadge: boolean;
    enhancedSearch: boolean;
    treatmentsLimit: number;
    reviewDisplay: 'basic' | 'enhanced' | 'premium';
    enhancedContactUX: boolean;
    customTracking: boolean;
    snapshotReport: boolean;
    priorityListing: boolean;
  };
}

interface ClinicsDataState {
  clients: Clinic[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

export interface ClientFilters {
  package?: 'Free' | 'Basic' | 'Premium';
  status?: 'Active' | 'Trial' | 'Paused' | 'Canceled';
  state?: string;
  salesRep?: string;
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
}

export const useClinicData = (
  filters: ClientFilters = {},
  page: number = 1,
  pageLimit: number = 10
) => {
  const [data, setData] = useState<ClinicsDataState>({
    clients: [],
    loading: true,
    error: null,
    totalCount: 0
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Fetch clinics from Firebase
        const clinicsRef = collection(db, 'clinics');
        let q = query(clinicsRef, orderBy('name'));
        
        // Apply Firebase-compatible filters
        if (filters.status) {
          q = query(clinicsRef, where('status', '==', filters.status), orderBy('name'));
        }
        
        if (filters.state) {
          q = query(clinicsRef, where('state', '==', filters.state), orderBy('name'));
        }
        
        const snapshot = await getDocs(q);
        
        let clinicsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Ensure dates are converted to strings
          joinDate: doc.data().joinDate?.toDate?.()?.toISOString().split('T')[0] || '',
          lastContact: doc.data().lastContact?.toDate?.()?.toISOString().split('T')[0] || ''
        })) as Clinic[];
        
        // Apply client-side filters that can't be done in Firebase
        if (filters.package) {
          clinicsData = clinicsData.filter(client => client.package === filters.package);
        }
        
        if (filters.salesRep) {
          clinicsData = clinicsData.filter(client => client.salesRep === filters.salesRep);
        }
        
        if (filters.startDate) {
          clinicsData = clinicsData.filter(client => 
            new Date(client.joinDate) >= filters.startDate!
          );
        }
        
        if (filters.endDate) {
          clinicsData = clinicsData.filter(client => 
            new Date(client.joinDate) <= filters.endDate!
          );
        }
        
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          clinicsData = clinicsData.filter(client => 
            client.name.toLowerCase().includes(term) || 
            client.city.toLowerCase().includes(term) || 
            client.state.toLowerCase().includes(term) ||
            client.email?.toLowerCase().includes(term) ||
            client.phone?.includes(term)
          );
        }
        
        // Get total count before pagination
        const totalCount = clinicsData.length;
        
        // Apply pagination
        const start = (page - 1) * pageLimit;
        const end = start + pageLimit;
        const paginatedClients = clinicsData.slice(start, end);
        
        setData({
          clients: paginatedClients,
          loading: false,
          error: null,
          totalCount
        });
      } catch (error) {
        console.error('Error fetching clients data:', error);
        setData({
          clients: [],
          loading: false,
          error: 'Failed to load clients data',
          totalCount: 0
        });
      }
    };

    fetchClients();
  }, [
    filters.package,
    filters.status,
    filters.state,
    filters.salesRep,
    filters.startDate,
    filters.endDate,
    filters.searchTerm,
    page,
    pageLimit
  ]);

  return data;
};

// Hook to fetch detailed data for a single clinic
export interface DetailedClinic extends Clinic {
  billing: {
    subscription: string;
    amount: number;
    nextBilling: Date;
    paymentMethod: string;
  };
  analytics: {
    profileViews: number;
    phoneClicks: number;
    websiteClicks: number;
    searchAppearances: number;
  };
  seo: {
    indexed: boolean;
    lastCrawled?: Date;
    score: number;
    issues: string[];
  };
}

export const useClinicDetail = (clinicId: string) => {
  const [data, setData] = useState<{
    clinic: DetailedClinic | null;
    loading: boolean;
    error: string | null;
  }>({
    clinic: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchClinicDetail = async () => {
      try {
        // Fetch from Firebase
        const clinicRef = doc(db, 'clinics', clinicId);
        const clinicSnap = await getDoc(clinicRef);
        
        if (!clinicSnap.exists()) {
          throw new Error('Clinic not found');
        }
        
        const clinicData = {
          id: clinicSnap.id,
          ...clinicSnap.data(),
          // TODO: Fetch additional data from related collections
          billing: {
            subscription: clinicSnap.data().package || 'Free',
            amount: 0,
            nextBilling: new Date(),
            paymentMethod: 'N/A'
          },
          analytics: {
            profileViews: 0,
            phoneClicks: 0,
            websiteClicks: 0,
            searchAppearances: 0
          },
          seo: {
            indexed: false,
            score: 0,
            issues: []
          }
        } as DetailedClinic;
        
        setData({
          clinic: clinicData,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching clinic detail:', error);
        setData({
          clinic: null,
          loading: false,
          error: 'Failed to load clinic details'
        });
      }
    };

    if (clinicId) {
      fetchClinicDetail();
    }
  }, [clinicId]);

  return data;
};