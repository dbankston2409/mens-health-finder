/**
 * Affiliate Partner System Service
 * Handles CRUD operations and data access for affiliates
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  doc, 
  serverTimestamp, 
  orderBy,
  limit,
  increment,
  Timestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../../apps/web/lib/firebase';
import { Affiliate, AffiliateReferral, AffiliatePayout, AffiliateType, PayoutTier } from '../models/affiliate';

/**
 * Create a new affiliate partner
 */
export async function createAffiliate(data: Omit<Affiliate, 'id' | 'createdAt' | 'stats'>): Promise<string> {
  try {
    // Check if code already exists
    const existingAffiliates = await getDocs(
      query(collection(db, 'affiliates'), where('code', '==', data.code))
    );
    
    if (!existingAffiliates.empty) {
      throw new Error(`Affiliate code "${data.code}" already exists`);
    }
    
    // Create new affiliate
    const affiliateRef = await addDoc(collection(db, 'affiliates'), {
      ...data,
      createdAt: serverTimestamp(),
      stats: {
        referralClicks: 0,
        uniqueVisitors: 0,
        conversionCount: 0
      }
    });
    
    return affiliateRef.id;
  } catch (error) {
    console.error('Error creating affiliate:', error);
    throw error;
  }
}

/**
 * Get affiliate by ID
 */
export async function getAffiliateById(id: string): Promise<Affiliate | null> {
  try {
    const docRef = doc(db, 'affiliates', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Affiliate;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting affiliate:', error);
    throw error;
  }
}

/**
 * Get affiliate by code
 */
export async function getAffiliateByCode(code: string): Promise<Affiliate | null> {
  try {
    const affiliatesRef = collection(db, 'affiliates');
    const q = query(affiliatesRef, where('code', '==', code));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0];
      return { id: docData.id, ...docData.data() } as Affiliate;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting affiliate by code:', error);
    throw error;
  }
}

/**
 * Update affiliate details
 */
export async function updateAffiliate(
  id: string, 
  data: Partial<Omit<Affiliate, 'id' | 'createdAt' | 'stats'>>
): Promise<boolean> {
  try {
    const docRef = doc(db, 'affiliates', id);
    
    await updateDoc(docRef, {
      ...data,
      lastUpdated: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating affiliate:', error);
    return false;
  }
}

/**
 * Get all affiliates with optional filtering
 */
export async function getAllAffiliates(options?: {
  type?: AffiliateType;
  isActive?: boolean;
  limit?: number;
}): Promise<Affiliate[]> {
  try {
    const affiliatesRef = collection(db, 'affiliates');
    let q = query(affiliatesRef, orderBy('createdAt', 'desc'));
    
    if (options?.type) {
      q = query(q, where('type', '==', options.type));
    }
    
    if (options?.isActive !== undefined) {
      q = query(q, where('isActive', '==', options.isActive));
    }
    
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }
    
    const querySnapshot = await getDocs(q);
    
    const affiliates: Affiliate[] = [];
    querySnapshot.forEach((doc) => {
      affiliates.push({ id: doc.id, ...doc.data() } as Affiliate);
    });
    
    return affiliates;
  } catch (error) {
    console.error('Error getting affiliates:', error);
    throw error;
  }
}

/**
 * Track a referral click from an affiliate
 */
export async function trackReferralClick(
  affiliateCode: string,
  targetUrl: string,
  targetType: AffiliateReferral['targetType'],
  targetId?: string,
  sessionData?: {
    sessionId: string;
    clientIp?: string;
    utmParams?: Record<string, string>;
  }
): Promise<{success: boolean, referralId?: string, error?: string}> {
  try {
    // Get the affiliate by code
    const affiliate = await getAffiliateByCode(affiliateCode);
    
    if (!affiliate) {
      return { success: false, error: 'Invalid affiliate code' };
    }
    
    if (!affiliate.isActive) {
      return { success: false, error: 'Affiliate is not active' };
    }
    
    // Create referral record
    const referral: Omit<AffiliateReferral, 'id'> = {
      affiliateId: affiliate.id!,
      affiliateCode,
      timestamp: Timestamp.now(),
      targetType,
      targetId,
      targetUrl,
      sessionId: sessionData?.sessionId,
      clientIp: sessionData?.clientIp,
      utmParams: sessionData?.utmParams,
      converted: false
    };
    
    // Add to referrals collection
    const referralRef = await addDoc(collection(db, 'referrals'), referral);
    
    // Update affiliate stats
    const affiliateRef = doc(db, 'affiliates', affiliate.id!);
    await updateDoc(affiliateRef, {
      'stats.referralClicks': increment(1),
      'stats.lastReferral': Timestamp.now()
    });
    
    return { success: true, referralId: referralRef.id };
  } catch (error) {
    console.error('Error tracking referral click:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error tracking referral' 
    };
  }
}

/**
 * Track a conversion from an affiliate referral
 */
export async function trackAffiliateConversion(
  referralId: string,
  conversionType: AffiliateReferral['conversionType'],
  conversionValue?: number
): Promise<{success: boolean, error?: string}> {
  try {
    const referralRef = doc(db, 'referrals', referralId);
    const referralSnap = await getDoc(referralRef);
    
    if (!referralSnap.exists()) {
      return { success: false, error: 'Referral not found' };
    }
    
    const referralData = referralSnap.data() as AffiliateReferral;
    
    // If already converted, don't double-count
    if (referralData.converted) {
      return { success: true };
    }
    
    // Update the referral
    await updateDoc(referralRef, {
      converted: true,
      conversionType,
      conversionTimestamp: Timestamp.now(),
      conversionValue
    });
    
    // Update the affiliate stats
    const affiliateRef = doc(db, 'affiliates', referralData.affiliateId);
    await updateDoc(affiliateRef, {
      'stats.conversionCount': increment(1)
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error tracking conversion:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error tracking conversion' 
    };
  }
}

/**
 * Get referrals for an affiliate
 */
export async function getAffiliateReferrals(
  affiliateId: string, 
  options?: {
    startDate?: Date;
    endDate?: Date;
    converted?: boolean;
    limit?: number;
  }
): Promise<AffiliateReferral[]> {
  try {
    const referralsRef = collection(db, 'referrals');
    let q = query(referralsRef, where('affiliateId', '==', affiliateId), orderBy('timestamp', 'desc'));
    
    if (options?.startDate) {
      q = query(q, where('timestamp', '>=', Timestamp.fromDate(options.startDate)));
    }
    
    if (options?.endDate) {
      q = query(q, where('timestamp', '<=', Timestamp.fromDate(options.endDate)));
    }
    
    if (options?.converted !== undefined) {
      q = query(q, where('converted', '==', options.converted));
    }
    
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }
    
    const querySnapshot = await getDocs(q);
    
    const referrals: AffiliateReferral[] = [];
    querySnapshot.forEach((doc) => {
      referrals.push({ id: doc.id, ...doc.data() } as AffiliateReferral);
    });
    
    return referrals;
  } catch (error) {
    console.error('Error getting affiliate referrals:', error);
    throw error;
  }
}

/**
 * Create a new payout for an affiliate
 */
export async function createAffiliatePayout(
  affiliateId: string,
  payoutData: {
    amount: number;
    currency: string;
    method: AffiliatePayout['method'];
    reference?: string;
    notes?: string;
    referralIds: string[];
    dateRange: {
      start: Date;
      end: Date;
    };
  },
  adminId: string
): Promise<string> {
  try {
    // Verify the affiliate exists
    const affiliateRef = doc(db, 'affiliates', affiliateId);
    const affiliateSnap = await getDoc(affiliateRef);
    
    if (!affiliateSnap.exists()) {
      throw new Error('Affiliate not found');
    }
    
    // Create payout record
    const payout: Omit<AffiliatePayout, 'id'> = {
      affiliateId,
      amount: payoutData.amount,
      currency: payoutData.currency,
      date: Timestamp.now(),
      status: 'pending',
      method: payoutData.method,
      reference: payoutData.reference,
      referralIds: payoutData.referralIds,
      referralCount: payoutData.referralIds.length,
      dateRange: {
        start: Timestamp.fromDate(payoutData.dateRange.start),
        end: Timestamp.fromDate(payoutData.dateRange.end)
      },
      adminId,
      notes: payoutData.notes
    };
    
    // Run in transaction to update referrals and affiliate
    const payoutRef = await runTransaction(db, async (transaction) => {
      // Create the payout
      const newPayoutRef = doc(collection(db, 'affiliate_payouts'));
      transaction.set(newPayoutRef, payout);
      
      // Update the referrals
      payoutData.referralIds.forEach((referralId) => {
        const referralRef = doc(db, 'referrals', referralId);
        transaction.update(referralRef, {
          isPaid: true,
          payoutId: newPayoutRef.id,
          payoutAmount: payoutData.amount / payoutData.referralIds.length // Distribute evenly for now
        });
      });
      
      // Update affiliate stats
      transaction.update(affiliateRef, {
        'stats.lastPayout': {
          amount: payoutData.amount,
          date: Timestamp.now(),
          reference: payoutData.reference
        },
        'stats.totalPaid': increment(payoutData.amount)
      });
      
      return newPayoutRef;
    });
    
    return payoutRef.id;
  } catch (error) {
    console.error('Error creating affiliate payout:', error);
    throw error;
  }
}

/**
 * Get payouts for an affiliate
 */
export async function getAffiliatePayouts(
  affiliateId: string, 
  options?: {
    status?: AffiliatePayout['status'];
    limit?: number;
  }
): Promise<AffiliatePayout[]> {
  try {
    const payoutsRef = collection(db, 'affiliate_payouts');
    let q = query(payoutsRef, where('affiliateId', '==', affiliateId), orderBy('date', 'desc'));
    
    if (options?.status) {
      q = query(q, where('status', '==', options.status));
    }
    
    if (options?.limit) {
      q = query(q, limit(options.limit));
    }
    
    const querySnapshot = await getDocs(q);
    
    const payouts: AffiliatePayout[] = [];
    querySnapshot.forEach((doc) => {
      payouts.push({ id: doc.id, ...doc.data() } as AffiliatePayout);
    });
    
    return payouts;
  } catch (error) {
    console.error('Error getting affiliate payouts:', error);
    throw error;
  }
}

export default {
  createAffiliate,
  getAffiliateById,
  getAffiliateByCode,
  updateAffiliate,
  getAllAffiliates,
  trackReferralClick,
  trackAffiliateConversion,
  getAffiliateReferrals,
  createAffiliatePayout,
  getAffiliatePayouts
};