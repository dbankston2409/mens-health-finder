import { db } from '../../lib/firebase';
import { collection, addDoc, updateDoc, doc, Timestamp, increment } from 'firebase/firestore';
import { CrmActivity, CrmContact } from './crmContactModel';

export interface ActivityLogData {
  contactId: string;
  clinicSlug: string;
  type: CrmActivity['type'];
  subject: string;
  description?: string;
  direction?: 'inbound' | 'outbound';
  outcome?: 'successful' | 'no_answer' | 'voicemail' | 'busy' | 'failed';
  duration?: number;
  emailId?: string;
  meetingLink?: string;
  attachments?: string[];
  requiresFollowUp?: boolean;
  followUpDate?: Date;
  followUpAssignedTo?: string;
  isAutomated?: boolean;
  createdBy: string;
}

export async function logCrmActivity(activityData: ActivityLogData): Promise<string> {
  try {
    // Create the activity document
    const activity: Omit<CrmActivity, 'id'> = {
      contactId: activityData.contactId,
      clinicSlug: activityData.clinicSlug,
      type: activityData.type,
      subject: activityData.subject,
      description: activityData.description,
      direction: activityData.direction,
      outcome: activityData.outcome,
      duration: activityData.duration,
      emailId: activityData.emailId,
      meetingLink: activityData.meetingLink,
      attachments: activityData.attachments || [],
      requiresFollowUp: activityData.requiresFollowUp || false,
      followUpDate: activityData.followUpDate ? Timestamp.fromDate(activityData.followUpDate) : undefined,
      followUpAssignedTo: activityData.followUpAssignedTo,
      createdAt: Timestamp.now(),
      createdBy: activityData.createdBy,
      isAutomated: activityData.isAutomated || false
    };

    // Add activity to Firestore
    const activityRef = await addDoc(collection(db, 'crmActivities'), activity);

    // Update contact's last activity date and interaction count
    const contactRef = doc(db, 'crmContacts', activityData.contactId);
    const updateData: Partial<CrmContact> = {
      lastActivityDate: Timestamp.now(),
      totalInteractions: increment(1),
      updatedAt: Timestamp.now()
    };

    // Update last contact date if this was a direct communication
    const directCommunicationTypes = ['email', 'call', 'meeting'];
    if (directCommunicationTypes.includes(activityData.type)) {
      updateData.lastContactDate = Timestamp.now();
    }

    // Update email engagement metrics
    if (activityData.type === 'email') {
      if (activityData.direction === 'outbound') {
        // This is an email we sent - don't increment opens/clicks yet
      } else {
        // This is tracking an email interaction (open/click)
        if (activityData.subject.toLowerCase().includes('opened')) {
          updateData.emailOpens = increment(1);
        }
        if (activityData.subject.toLowerCase().includes('clicked')) {
          updateData.emailClicks = increment(1);
        }
      }
    }

    // Update website visit tracking
    if (activityData.type === 'website_visit') {
      updateData.websiteVisits = increment(1);
    }

    await updateDoc(contactRef, updateData);

    return activityRef.id;
  } catch (error) {
    console.error('Error logging CRM activity:', error);
    throw new Error('Failed to log CRM activity');
  }
}

export async function logEmailActivity({
  contactId,
  clinicSlug,
  emailId,
  subject,
  direction = 'outbound',
  createdBy,
  isAutomated = false
}: {
  contactId: string;
  clinicSlug: string;
  emailId: string;
  subject: string;
  direction?: 'inbound' | 'outbound';
  createdBy: string;
  isAutomated?: boolean;
}): Promise<string> {
  return logCrmActivity({
    contactId,
    clinicSlug,
    type: 'email',
    subject,
    direction,
    emailId,
    createdBy,
    isAutomated
  });
}

export async function logCallActivity({
  contactId,
  clinicSlug,
  subject,
  outcome,
  duration,
  notes,
  createdBy
}: {
  contactId: string;
  clinicSlug: string;
  subject: string;
  outcome: 'successful' | 'no_answer' | 'voicemail' | 'busy' | 'failed';
  duration?: number;
  notes?: string;
  createdBy: string;
}): Promise<string> {
  return logCrmActivity({
    contactId,
    clinicSlug,
    type: 'call',
    subject,
    description: notes,
    direction: 'outbound',
    outcome,
    duration,
    createdBy
  });
}

export async function logMeetingActivity({
  contactId,
  clinicSlug,
  subject,
  meetingLink,
  duration,
  notes,
  createdBy
}: {
  contactId: string;
  clinicSlug: string;
  subject: string;
  meetingLink?: string;
  duration?: number;
  notes?: string;
  createdBy: string;
}): Promise<string> {
  return logCrmActivity({
    contactId,
    clinicSlug,
    type: 'meeting',
    subject,
    description: notes,
    meetingLink,
    duration,
    createdBy
  });
}

export async function logWebsiteVisit({
  contactId,
  clinicSlug,
  pagePath,
  sessionDuration,
  isAutomated = true
}: {
  contactId: string;
  clinicSlug: string;
  pagePath: string;
  sessionDuration?: number;
  isAutomated?: boolean;
}): Promise<string> {
  return logCrmActivity({
    contactId,
    clinicSlug,
    type: 'website_visit',
    subject: `Visited ${pagePath}`,
    duration: sessionDuration,
    createdBy: 'system',
    isAutomated
  });
}

export async function logFormSubmission({
  contactId,
  clinicSlug,
  formName,
  formData,
  isAutomated = true
}: {
  contactId: string;
  clinicSlug: string;
  formName: string;
  formData: Record<string, any>;
  isAutomated?: boolean;
}): Promise<string> {
  return logCrmActivity({
    contactId,
    clinicSlug,
    type: 'form_submission',
    subject: `Submitted ${formName}`,
    description: JSON.stringify(formData),
    createdBy: 'system',
    isAutomated
  });
}