import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export type CommunicationEvent = {
  id: string;
  clinicId: string;
  timestamp: Date;
  type: 'email' | 'sms' | 'note' | 'call';
  direction: 'inbound' | 'outbound' | 'internal';
  sender: string;
  recipient: string;
  subject?: string;
  content: string;
  status?: 'delivered' | 'failed' | 'pending';
  adminId?: string;
  adminName?: string;
};

export const useComms = (clinicId: string | undefined) => {
  const [comms, setComms] = useState<CommunicationEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Query communications for this clinic
    const commsRef = collection(db, 'communications');
    const commsQuery = query(
      commsRef,
      where('clinicId', '==', clinicId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      commsQuery,
      (querySnapshot) => {
        const commEvents: CommunicationEvent[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Convert timestamp to Date
          const timestamp = data.timestamp 
            ? new Date(data.timestamp.seconds * 1000) 
            : new Date();

          const event: CommunicationEvent = {
            id: doc.id,
            clinicId: data.clinicId,
            timestamp,
            type: data.type || 'note',
            direction: data.direction || 'internal',
            sender: data.sender || 'system',
            recipient: data.recipient || '',
            subject: data.subject,
            content: data.content || '',
            status: data.status,
            adminId: data.adminId,
            adminName: data.adminName,
          };

          commEvents.push(event);
        });

        setComms(commEvents);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching communications:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId]);

  return { comms, loading, error };
};

export default useComms;