import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, serverTimestamp, getDoc } from '../lib/firebase-compat';

export interface LeadEvent {
  type: 'form_submission' | 'call_click' | 'review_submit' | 'email_open' | 'page_visit' | 'direction_click';
  timestamp: Date;
  data?: Record<string, any>;
  source: string;
}

export interface ContactProfile {
  userId?: string;
  email?: string;
  phone?: string;
  name?: string;
  clinicSlug: string;
  clinicName: string;
  firstSeen: Date;
  lastInteraction: Date;
  status: 'prospect' | 'active' | 'converted' | 'inactive';
  interactionCount: number;
  events: LeadEvent[];
  leadQuality: 'cold' | 'warm' | 'hot';
  tags: string[];
  notes?: string;
  source: string;
}

export interface ConversionResult {
  success: boolean;
  contactId?: string;
  action: 'created' | 'updated' | 'no_action';
  reason?: string;
  error?: string;
}

export async function convertLeadToContact(
  identifier: { email?: string; phone?: string; userId?: string },
  clinicSlug: string,
  newEvent?: LeadEvent
): Promise<ConversionResult> {
  try {
    const { email, phone, userId } = identifier;
    
    if (!email && !phone && !userId) {
      return {
        success: false,
        action: 'no_action',
        reason: 'No valid identifier provided'
      };
    }
    
    // Find existing contact
    const existingContact = await findExistingContact(identifier, clinicSlug);
    
    if (existingContact) {
      // Update existing contact
      return await updateExistingContact(existingContact.id, newEvent);
    }
    
    // Gather all lead data for this identifier
    const leadData = await gatherLeadData(identifier, clinicSlug);
    
    // Check if qualifies for conversion (2+ interactions)
    const qualifiesForConversion = evaluateConversionCriteria(leadData);
    
    if (!qualifiesForConversion) {
      return {
        success: false,
        action: 'no_action',
        reason: 'Insufficient interactions for conversion'
      };
    }
    
    // Create new contact
    const contactId = await createNewContact(leadData, clinicSlug, newEvent);
    
    return {
      success: true,
      contactId,
      action: 'created',
      reason: 'Lead converted to contact based on interaction threshold'
    };
    
  } catch (error) {
    console.error('Error converting lead to contact:', error);
    return {
      success: false,
      action: 'no_action',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function findExistingContact(
  identifier: { email?: string; phone?: string; userId?: string },
  clinicSlug: string
): Promise<{ id: string; data: ContactProfile } | null> {
  try {
    const contactsRef = collection(db, 'contacts');
    let contactQuery;
    
    if (identifier.userId) {
      contactQuery = query(
        contactsRef,
        where('userId', '==', identifier.userId),
        where('clinicSlug', '==', clinicSlug)
      );
    } else if (identifier.email) {
      contactQuery = query(
        contactsRef,
        where('email', '==', identifier.email.toLowerCase()),
        where('clinicSlug', '==', clinicSlug)
      );
    } else if (identifier.phone) {
      contactQuery = query(
        contactsRef,
        where('phone', '==', identifier.phone),
        where('clinicSlug', '==', clinicSlug)
      );
    } else {
      return null;
    }
    
    const snapshot = await getDocs(contactQuery);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        data: doc.data() as ContactProfile
      };
    }
    
    return null;
    
  } catch (error) {
    console.error('Error finding existing contact:', error);
    return null;
  }
}

async function gatherLeadData(
  identifier: { email?: string; phone?: string; userId?: string },
  clinicSlug: string
): Promise<any[]> {
  const leadData: any[] = [];
  
  try {
    // Gather from leads collection
    const leadsRef = collection(db, 'leads');
    let leadsQuery;
    
    if (identifier.email) {
      leadsQuery = query(
        leadsRef,
        where('email', '==', identifier.email.toLowerCase()),
        where('clinicSlug', '==', clinicSlug)
      );
      const leadsSnapshot = await getDocs(leadsQuery);
      leadData.push(...leadsSnapshot.docs.map(doc => ({ 
        type: 'lead', 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate() || new Date()
      })));
    }
    
    if (identifier.phone) {
      leadsQuery = query(
        leadsRef,
        where('phone', '==', identifier.phone),
        where('clinicSlug', '==', clinicSlug)
      );
      const leadsSnapshot = await getDocs(leadsQuery);
      leadData.push(...leadsSnapshot.docs.map(doc => ({ 
        type: 'lead', 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate() || new Date()
      })));
    }
    
    // Gather from reviews collection
    const reviewsRef = collection(db, 'reviews');
    let reviewsQuery;
    
    if (identifier.email) {
      reviewsQuery = query(
        reviewsRef,
        where('email', '==', identifier.email.toLowerCase()),
        where('clinicSlug', '==', clinicSlug)
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      leadData.push(...reviewsSnapshot.docs.map(doc => ({ 
        type: 'review', 
        id: doc.id, 
        ...doc.data(),
        timestamp: doc.data().createdAt?.toDate() || new Date()
      })));
    }
    
    // Gather from lead sessions
    const sessionsRef = collection(db, 'leadSessions');
    let sessionsQuery;
    
    if (identifier.email || identifier.phone) {
      sessionsQuery = query(
        sessionsRef,
        where('clinicSlug', '==', clinicSlug)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);
      
      // Filter sessions that match identifier
      const matchingSessions = sessionsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((session: any) => 
          (identifier.email && session.email === identifier.email) ||
          (identifier.phone && session.phone === identifier.phone)
        );
      
      leadData.push(...matchingSessions.map(session => ({
        type: 'session',
        id: session.id,
        ...session,
        timestamp: session.createdAt?.toDate() || new Date()
      })));
    }
    
    return leadData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
  } catch (error) {
    console.error('Error gathering lead data:', error);
    return [];
  }
}

function evaluateConversionCriteria(leadData: any[]): boolean {
  // Require at least 2 meaningful interactions
  const meaningfulInteractions = leadData.filter(item => 
    item.type === 'lead' || 
    item.type === 'review' || 
    (item.type === 'session' && item.actions?.length >= 3)
  );
  
  return meaningfulInteractions.length >= 2;
}

async function createNewContact(
  leadData: any[],
  clinicSlug: string,
  newEvent?: LeadEvent
): Promise<string> {
  try {
    // Get clinic info
    const clinicRef = doc(db, 'clinics', clinicSlug);
    const clinicDoc = await getDoc(clinicRef);
    const clinic = clinicDoc.exists() ? clinicDoc.data() : null;
    
    // Extract contact info from lead data
    const contactInfo = extractContactInfo(leadData);
    
    // Build events array
    const events: LeadEvent[] = buildEventsArray(leadData);
    if (newEvent) {
      events.push(newEvent);
    }
    
    // Determine lead quality
    const leadQuality = assessLeadQuality(leadData, events);
    
    // Generate contact ID
    const contactId = generateContactId(contactInfo.email, contactInfo.phone, clinicSlug);
    
    // Create contact profile
    const contactProfile: ContactProfile = {
      userId: contactInfo.userId,
      email: contactInfo.email?.toLowerCase(),
      phone: contactInfo.phone,
      name: contactInfo.name,
      clinicSlug,
      clinicName: clinic?.name || 'Unknown Clinic',
      firstSeen: events[0]?.timestamp || new Date(),
      lastInteraction: events[events.length - 1]?.timestamp || new Date(),
      status: 'active',
      interactionCount: events.length,
      events,
      leadQuality,
      tags: generateContactTags(leadData, events),
      source: determinePrimarySource(leadData),
    };
    
    // Save to Firestore
    const contactRef = doc(db, 'contacts', contactId);
    await setDoc(contactRef, {
      ...contactProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Lead converted to contact: ${contactId} for ${clinic?.name}`);
    
    return contactId;
    
  } catch (error) {
    console.error('Error creating new contact:', error);
    throw error;
  }
}

async function updateExistingContact(
  contactId: string,
  newEvent?: LeadEvent
): Promise<ConversionResult> {
  try {
    if (!newEvent) {
      return {
        success: true,
        contactId,
        action: 'no_action',
        reason: 'No new event to add'
      };
    }
    
    const contactRef = doc(db, 'contacts', contactId);
    const contactDoc = await getDoc(contactRef);
    
    if (!contactDoc.exists()) {
      throw new Error('Contact not found');
    }
    
    const contact = contactDoc.data() as ContactProfile;
    const updatedEvents = [...contact.events, newEvent];
    
    await updateDoc(contactRef, {
      events: updatedEvents,
      lastInteraction: newEvent.timestamp,
      interactionCount: updatedEvents.length,
      leadQuality: assessLeadQuality([], updatedEvents),
      updatedAt: serverTimestamp()
    });
    
    return {
      success: true,
      contactId,
      action: 'updated',
      reason: 'Added new event to existing contact'
    };
    
  } catch (error) {
    console.error('Error updating existing contact:', error);
    return {
      success: false,
      contactId,
      action: 'no_action',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function extractContactInfo(leadData: any[]): {
  userId?: string;
  email?: string;
  phone?: string;
  name?: string;
} {
  const info: any = {};
  
  for (const item of leadData) {
    if (item.userId && !info.userId) info.userId = item.userId;
    if (item.email && !info.email) info.email = item.email;
    if (item.phone && !info.phone) info.phone = item.phone;
    if (item.name && !info.name) info.name = item.name;
    if (item.displayName && !info.name) info.name = item.displayName;
  }
  
  return info;
}

function buildEventsArray(leadData: any[]): LeadEvent[] {
  const events: LeadEvent[] = [];
  
  for (const item of leadData) {
    switch (item.type) {
      case 'lead':
        events.push({
          type: 'form_submission',
          timestamp: item.timestamp,
          data: {
            message: item.message,
            source: item.source
          },
          source: item.source || 'website'
        });
        break;
      
      case 'review':
        events.push({
          type: 'review_submit',
          timestamp: item.timestamp,
          data: {
            rating: item.rating,
            text: item.text
          },
          source: 'website'
        });
        break;
      
      case 'session':
        if (item.actions) {
          for (const action of item.actions) {
            events.push({
              type: mapActionToEventType(action.action),
              timestamp: new Date(action.timestamp),
              data: action.data,
              source: 'website'
            });
          }
        }
        break;
    }
  }
  
  return events.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}

function mapActionToEventType(action: string): LeadEvent['type'] {
  switch (action) {
    case 'clicked-call':
    case 'phone-click':
      return 'call_click';
    case 'clicked-directions':
      return 'direction_click';
    case 'form-submitted':
      return 'form_submission';
    case 'email-opened':
      return 'email_open';
    default:
      return 'page_visit';
  }
}

function assessLeadQuality(leadData: any[], events: LeadEvent[]): 'cold' | 'warm' | 'hot' {
  let score = 0;
  
  // Score based on event types
  for (const event of events) {
    switch (event.type) {
      case 'form_submission':
        score += 10;
        break;
      case 'call_click':
        score += 8;
        break;
      case 'review_submit':
        score += 6;
        break;
      case 'direction_click':
        score += 4;
        break;
      case 'email_open':
        score += 2;
        break;
      case 'page_visit':
        score += 1;
        break;
    }
  }
  
  // Score based on frequency
  if (events.length >= 5) score += 5;
  else if (events.length >= 3) score += 3;
  
  // Score based on recency
  const lastEvent = events[events.length - 1];
  if (lastEvent) {
    const daysSinceLastEvent = (Date.now() - lastEvent.timestamp.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastEvent <= 1) score += 5;
    else if (daysSinceLastEvent <= 7) score += 3;
  }
  
  if (score >= 20) return 'hot';
  if (score >= 10) return 'warm';
  return 'cold';
}

function generateContactTags(leadData: any[], events: LeadEvent[]): string[] {
  const tags: string[] = [];
  
  // Add tags based on event types
  if (events.some(e => e.type === 'form_submission')) tags.push('form-submitted');
  if (events.some(e => e.type === 'call_click')) tags.push('called-clinic');
  if (events.some(e => e.type === 'review_submit')) tags.push('left-review');
  if (events.some(e => e.type === 'direction_click')) tags.push('visited-location');
  
  // Add tags based on lead quality
  const quality = assessLeadQuality(leadData, events);
  tags.push(`quality-${quality}`);
  
  // Add tags based on interaction frequency
  if (events.length >= 5) tags.push('highly-engaged');
  else if (events.length >= 3) tags.push('engaged');
  
  return tags;
}

function determinePrimarySource(leadData: any[]): string {
  const sources = leadData.map(item => item.source).filter(Boolean);
  
  // Priority: form submission > review > session
  if (sources.includes('profile-cta')) return 'profile-cta';
  if (sources.includes('directory-landing')) return 'directory-landing';
  if (sources.includes('search-results')) return 'search-results';
  
  return sources[0] || 'unknown';
}

function generateContactId(email?: string, phone?: string, clinicSlug?: string): string {
  const identifier = email || phone || 'anonymous';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6);
  
  return `contact_${clinicSlug}_${identifier.replace(/[@.\-\s]/g, '_')}_${timestamp}_${random}`;
}