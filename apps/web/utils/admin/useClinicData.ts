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
  package: 'Free' | 'Basic' | 'Premium';
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
}

export interface ClientsData {
  clients: Clinic[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

// Hook to fetch all clients data
export const useClientsData = (
  filters: { 
    package?: string; 
    status?: string; 
    state?: string;
    salesRep?: string;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
  } = {},
  page: number = 1,
  limit: number = 10
): ClientsData => {
  const [data, setData] = useState<ClientsData>({
    clients: [],
    loading: true,
    error: null,
    totalCount: 0
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // In a real app, we would fetch this data from Firebase
        // For now, we'll use mock data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock clients data
        const mockClients: Clinic[] = Array.from({ length: 35 }, (_, i) => {
          const packages = ['Free', 'Basic', 'Premium'] as const;
          const statuses = ['Active', 'Trial', 'Paused', 'Canceled'] as const;
          const states = ['TX', 'CA', 'FL', 'NY', 'IL'];
          const services = ['TRT', 'ED Treatment', 'Weight Management', 'Hair Loss', 'Peptide Therapy', 'Hormone Optimization'];
          const salesReps = ['John Smith', 'Emily Johnson', 'Michael Brown', 'Sarah Wilson'];
          
          const randomDate = (start: Date, end: Date) => {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
          };
          
          const joinDate = randomDate(new Date(2022, 0, 1), new Date());
          const lastContact = randomDate(joinDate, new Date());
          
          return {
            id: `clinic-${(i + 1).toString().padStart(3, '0')}`,
            name: `Men's Health Clinic ${i + 1}`,
            city: ['Austin', 'Dallas', 'Houston', 'San Antonio', 'Los Angeles'][i % 5],
            state: states[i % states.length],
            address: `${1000 + i} Main St`,
            phone: `(555) ${100 + i}-${1000 + i}`,
            email: `clinic${i + 1}@example.com`,
            website: i % 3 === 0 ? `https://clinic${i + 1}.com` : undefined,
            package: packages[i % packages.length],
            status: statuses[i % statuses.length],
            joinDate: joinDate.toISOString().split('T')[0],
            lastContact: lastContact.toISOString().split('T')[0],
            engagementScore: Math.floor(Math.random() * 100),
            salesRep: salesReps[i % salesReps.length],
            services: services.slice(0, (i % 4) + 1),
            tags: i % 5 === 0 ? ['High Engagement', 'New Market'] : 
                  i % 5 === 1 ? ['Needs Photos'] : 
                  i % 5 === 2 ? ['Priority Client'] : undefined,
            notes: i % 4 === 0 ? ['Client requested follow-up on website updates', 'Interested in upgrading to premium tier'] : undefined
          };
        });
        
        // Apply filters
        let filteredClients = [...mockClients];
        
        if (filters.package) {
          filteredClients = filteredClients.filter(client => client.package === filters.package);
        }
        
        if (filters.status) {
          filteredClients = filteredClients.filter(client => client.status === filters.status);
        }
        
        if (filters.state) {
          filteredClients = filteredClients.filter(client => client.state === filters.state);
        }
        
        if (filters.salesRep) {
          filteredClients = filteredClients.filter(client => client.salesRep === filters.salesRep);
        }
        
        if (filters.startDate) {
          filteredClients = filteredClients.filter(client => 
            new Date(client.joinDate) >= filters.startDate!
          );
        }
        
        if (filters.endDate) {
          filteredClients = filteredClients.filter(client => 
            new Date(client.joinDate) <= filters.endDate!
          );
        }
        
        if (filters.searchTerm) {
          const term = filters.searchTerm.toLowerCase();
          filteredClients = filteredClients.filter(client => 
            client.name.toLowerCase().includes(term) || 
            client.city.toLowerCase().includes(term) || 
            client.state.toLowerCase().includes(term)
          );
        }
        
        // Get total count before pagination
        const totalCount = filteredClients.length;
        
        // Apply pagination
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedClients = filteredClients.slice(start, end);
        
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
    limit
  ]);

  return data;
};

// Hook to fetch detailed data for a single clinic
export interface DetailedClinic extends Clinic {
  billing: {
    history: Array<{
      id: string;
      date: string;
      amount: number;
      status: 'Paid' | 'Failed' | 'Pending' | 'Refunded';
      method: string;
      description: string;
    }>;
    upcomingInvoice?: {
      date: string;
      amount: number;
      description: string;
    };
    paymentMethod?: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    };
    cancellationReason?: string;
  };
  communication: {
    emails: Array<{
      id: string;
      date: string;
      subject: string;
      snippet: string;
      from: string;
      to: string;
      read: boolean;
    }>;
    notes: Array<{
      id: string;
      date: string;
      author: string;
      text: string;
      internal: boolean;
    }>;
  };
  analytics: {
    pageViews: number;
    uniqueVisitors: number;
    sources: Array<{ source: string; count: number }>;
    keywords: Array<{ keyword: string; impressions: number; clicks: number }>;
    bounceRate: number;
    avgTimeOnPage: number;
    callClicks: number;
    formSubmits: number;
  };
  suggestions: Array<{
    id: string;
    type: 'warning' | 'info' | 'success';
    message: string;
    actionText?: string;
    actionUrl?: string;
  }>;
}

export const useClinicDetail = (clinicId: string | null): { 
  clinic: DetailedClinic | null; 
  loading: boolean; 
  error: string | null 
} => {
  const [data, setData] = useState<{ 
    clinic: DetailedClinic | null; 
    loading: boolean; 
    error: string | null 
  }>({
    clinic: null,
    loading: true,
    error: null
  });

  useEffect(() => {
    if (!clinicId) {
      setData({
        clinic: null,
        loading: false,
        error: 'No clinic ID provided'
      });
      return;
    }

    const fetchClinicDetail = async () => {
      try {
        // In a real app, we would fetch this data from Firebase
        // For now, we'll use mock data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate mock detailed clinic data
        const mockClinic: DetailedClinic = {
          id: clinicId,
          name: 'Premier Men\'s Health Clinic',
          city: 'Austin',
          state: 'TX',
          address: '123 Main Street, Austin, TX 78701',
          phone: '(512) 555-1234',
          email: 'info@premiermenshealth.com',
          website: 'https://premiermenshealth.com',
          package: 'Premium',
          status: 'Active',
          joinDate: '2023-04-15',
          lastContact: '2023-10-10',
          engagementScore: 87,
          salesRep: 'John Smith',
          services: ['TRT', 'ED Treatment', 'Weight Management', 'Hair Loss'],
          tags: ['High Engagement', 'Priority Client'],
          notes: ['Client requested follow-up on website updates', 'Interested in expanding services'],
          billing: {
            history: [
              {
                id: 'inv-001',
                date: '2023-10-01',
                amount: 2400,
                status: 'Paid',
                method: 'Visa **** 4242',
                description: 'Premium Plan - Monthly'
              },
              {
                id: 'inv-002',
                date: '2023-09-01',
                amount: 2400,
                status: 'Paid',
                method: 'Visa **** 4242',
                description: 'Premium Plan - Monthly'
              },
              {
                id: 'inv-003',
                date: '2023-08-01',
                amount: 2400,
                status: 'Paid',
                method: 'Visa **** 4242',
                description: 'Premium Plan - Monthly'
              },
              {
                id: 'inv-004',
                date: '2023-07-01',
                amount: 2400,
                status: 'Paid',
                method: 'Visa **** 4242',
                description: 'Premium Plan - Monthly'
              }
            ],
            upcomingInvoice: {
              date: '2023-11-01',
              amount: 2400,
              description: 'Premium Plan - Monthly'
            },
            paymentMethod: {
              brand: 'Visa',
              last4: '4242',
              expMonth: 12,
              expYear: 2025
            }
          },
          communication: {
            emails: [
              {
                id: 'em-001',
                date: '2023-10-10',
                subject: 'Your Men\'s Health Finder Dashboard Updates',
                snippet: 'We\'ve made some exciting updates to your dashboard! Log in to check them out...',
                from: 'support@menshealthfinder.com',
                to: 'info@premiermenshealth.com',
                read: true
              },
              {
                id: 'em-002',
                date: '2023-09-25',
                subject: 'September Analytics Report',
                snippet: 'Your monthly analytics report is now available. You had 1,254 profile views this month...',
                from: 'analytics@menshealthfinder.com',
                to: 'info@premiermenshealth.com',
                read: true
              },
              {
                id: 'em-003',
                date: '2023-09-15',
                subject: 'New Review Notifications',
                snippet: 'You\'ve received 3 new reviews this week with an average rating of 4.8...',
                from: 'reviews@menshealthfinder.com',
                to: 'info@premiermenshealth.com',
                read: false
              }
            ],
            notes: [
              {
                id: 'note-001',
                date: '2023-10-12',
                author: 'John Smith',
                text: 'Called to discuss the new profile feature. They want to add more photos and service descriptions.',
                internal: true
              },
              {
                id: 'note-002',
                date: '2023-10-05',
                author: 'Emily Johnson',
                text: 'Resolved issue with analytics reporting. Client is happy with the solution.',
                internal: true
              },
              {
                id: 'note-003',
                date: '2023-09-28',
                author: 'Sarah Wilson',
                text: 'Client mentioned they\'re opening a new location in Dallas next month. Follow up about listing.',
                internal: true
              }
            ]
          },
          analytics: {
            pageViews: 2874,
            uniqueVisitors: 1683,
            sources: [
              { source: 'Google Search', count: 985 },
              { source: 'Direct', count: 426 },
              { source: 'Referral', count: 184 },
              { source: 'Social Media', count: 88 }
            ],
            keywords: [
              { keyword: 'trt clinic austin', impressions: 345, clicks: 78 },
              { keyword: 'testosterone replacement austin', impressions: 289, clicks: 56 },
              { keyword: 'erectile dysfunction treatment austin', impressions: 256, clicks: 47 },
              { keyword: 'mens health clinic austin', impressions: 204, clicks: 35 }
            ],
            bounceRate: 32.4,
            avgTimeOnPage: 3.8,
            callClicks: 86,
            formSubmits: 42
          },
          suggestions: [
            {
              id: 'sug-001',
              type: 'info',
              message: 'Profile has high engagement but no recent updates. Consider adding fresh content.',
              actionText: 'Edit Profile',
              actionUrl: `/admin/clinic/${clinicId}/edit`
            },
            {
              id: 'sug-002',
              type: 'success',
              message: 'High call-to-click ratio. Your call button is performing well.',
              actionText: 'View Analytics',
              actionUrl: `/admin/clinic/${clinicId}/analytics`
            },
            {
              id: 'sug-003',
              type: 'warning',
              message: 'No recent reviews in the past 30 days. Consider sending a request to recent patients.',
              actionText: 'Send Review Request',
              actionUrl: `/admin/clinic/${clinicId}/reviews/request`
            }
          ]
        };
        
        setData({
          clinic: mockClinic,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching clinic details:', error);
        setData({
          clinic: null,
          loading: false,
          error: 'Failed to load clinic details'
        });
      }
    };

    fetchClinicDetail();
  }, [clinicId]);

  return data;
};