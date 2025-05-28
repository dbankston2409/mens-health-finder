import { Timestamp } from 'firebase/firestore';

export interface CrmContact {
  id: string;
  clinicSlug: string;
  
  // Basic Info
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  
  // Contact Details
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  
  // Lead Information
  leadSource: 'website' | 'referral' | 'cold_outreach' | 'social_media' | 'paid_ads' | 'event' | 'other';
  leadScore: number; // 0-100
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'nurturing';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Pipeline Stage
  pipelineStage: string;
  estimatedValue?: number;
  closeProbability?: number; // 0-100
  expectedCloseDate?: Timestamp;
  
  // Tags and Categories
  tags: string[];
  category?: 'prospect' | 'customer' | 'partner' | 'vendor';
  
  // Communication Preferences
  preferredContactMethod: 'email' | 'phone' | 'text' | 'any';
  communicationFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  doNotContact: boolean;
  unsubscribed: boolean;
  
  // Engagement Data
  lastContactDate?: Timestamp;
  lastActivityDate?: Timestamp;
  totalInteractions: number;
  emailOpens: number;
  emailClicks: number;
  websiteVisits: number;
  
  // Follow-up Information
  nextFollowUpDate?: Timestamp;
  followUpNotes?: string;
  assignedTo?: string; // user ID
  
  // Custom Fields
  customFields: Record<string, any>;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  lastUpdatedBy: string;
}

export interface CrmActivity {
  id: string;
  contactId: string;
  clinicSlug: string;
  
  type: 'email' | 'call' | 'meeting' | 'note' | 'task' | 'proposal' | 'payment' | 'website_visit' | 'form_submission';
  subject: string;
  description?: string;
  
  // Communication Details
  direction?: 'inbound' | 'outbound';
  outcome?: 'successful' | 'no_answer' | 'voicemail' | 'busy' | 'failed';
  duration?: number; // in minutes
  
  // Associated Data
  emailId?: string;
  meetingLink?: string;
  attachments?: string[];
  
  // Follow-up
  requiresFollowUp: boolean;
  followUpDate?: Timestamp;
  followUpAssignedTo?: string;
  
  // Metadata
  createdAt: Timestamp;
  createdBy: string;
  isAutomated: boolean;
}

export interface CrmPipeline {
  id: string;
  clinicSlug: string;
  name: string;
  description?: string;
  
  stages: {
    id: string;
    name: string;
    order: number;
    color: string;
    winProbability: number; // 0-100
    isClosedWon: boolean;
    isClosedLost: boolean;
  }[];
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDefault: boolean;
  isActive: boolean;
}

export const DEFAULT_PIPELINE_STAGES = [
  { id: 'new', name: 'New Lead', order: 1, color: '#3B82F6', winProbability: 10, isClosedWon: false, isClosedLost: false },
  { id: 'contacted', name: 'Contacted', order: 2, color: '#8B5CF6', winProbability: 25, isClosedWon: false, isClosedLost: false },
  { id: 'qualified', name: 'Qualified', order: 3, color: '#F59E0B', winProbability: 50, isClosedWon: false, isClosedLost: false },
  { id: 'proposal', name: 'Proposal Sent', order: 4, color: '#10B981', winProbability: 75, isClosedWon: false, isClosedLost: false },
  { id: 'negotiation', name: 'Negotiation', order: 5, color: '#EF4444', winProbability: 85, isClosedWon: false, isClosedLost: false },
  { id: 'closed_won', name: 'Closed Won', order: 6, color: '#059669', winProbability: 100, isClosedWon: true, isClosedLost: false },
  { id: 'closed_lost', name: 'Closed Lost', order: 7, color: '#DC2626', winProbability: 0, isClosedWon: false, isClosedLost: true }
];