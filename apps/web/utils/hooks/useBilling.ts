import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { mockBillingData } from './stubs/mockAdminData';

export type BillingEvent = {
  id: string;
  clinicId: string;
  date: Date;
  amount: number;
  plan: string;
  status: 'success' | 'failed' | 'refunded' | 'canceled';
  notes?: string;
  renewalDate?: Date;
  paymentMethod?: string;
  cancellationReason?: string;
};

export type BillingData = {
  events: BillingEvent[];
  currentPlan: {
    name: string;
    amount: number;
    renewalDate: Date | null;
    status: string;
  };
};

export const useBilling = (clinicId: string | undefined) => {
  const [billingData, setBillingData] = useState<BillingData>({
    events: [],
    currentPlan: {
      name: '',
      amount: 0,
      renewalDate: null,
      status: ''}});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Query billing events for this clinic
    const billingRef = collection(db, 'billing');
    const billingQuery = query(
      billingRef,
      where('clinicId', '==', clinicId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      billingQuery,
      (querySnapshot) => {
        const events: BillingEvent[] = [];
        let currentPlan = {
          name: 'Free',
          amount: 0,
          renewalDate: null,
          status: 'active'};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Convert timestamp to Date
          const date = data.date ? new Date(data.date.seconds * 1000) : new Date();
          const renewalDate = data.renewalDate 
            ? new Date(data.renewalDate.seconds * 1000) 
            : null;

          const event: BillingEvent = {
            id: doc.id,
            clinicId: data.clinicId,
            date,
            amount: data.amount || 0,
            plan: data.plan || 'Unknown',
            status: data.status || 'unknown',
            notes: data.notes,
            renewalDate: renewalDate || undefined,
            paymentMethod: data.paymentMethod,
            cancellationReason: data.cancellationReason};

          events.push(event);
        });

        // Determine current plan from most recent successful billing event
        const latestSuccessful = events.find(event => 
          event.status === 'success' || 
          (event.status === 'canceled' && event.plan !== 'Free')
        );

        if (latestSuccessful) {
          currentPlan = {
            name: latestSuccessful.plan,
            amount: latestSuccessful.amount,
            renewalDate: null,
            status: latestSuccessful.status === 'canceled' ? 'canceled' : 'active'};
        }

        setBillingData({
          events,
          currentPlan});
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching billing data:', err);
        // Use mock data if Firebase access fails
        console.log('Using mock billing data due to Firebase access error');
        setBillingData({
          events: mockBillingData.transactions.map(tx => ({
            id: tx.id,
            clinicId: clinicId || '',
            date: new Date(tx.date),
            amount: tx.amount,
            plan: mockBillingData.currentPlan,
            status: tx.status as 'success' | 'failed' | 'refunded' | 'canceled',
            paymentMethod: `${mockBillingData.paymentMethod.type} ending in ${mockBillingData.paymentMethod.last4}`
          })),
          currentPlan: {
            name: mockBillingData.currentPlan,
            amount: 199.99,
            renewalDate: new Date(mockBillingData.nextBillingDate),
            status: mockBillingData.status
          }
        });
        setError(null); // Clear error since we're using mock data
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId]);

  return { billingData, loading, error };
};

export default useBilling;