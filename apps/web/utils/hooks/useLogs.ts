import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export type AdminLogEvent = {
  id: string;
  clinicId: string;
  timestamp: Date;
  actionType: string;
  adminId: string;
  adminName?: string;
  details?: any;
  notes?: string;
};

export const useLogs = (clinicId: string | undefined) => {
  const [logs, setLogs] = useState<AdminLogEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clinicId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Query admin logs for this clinic
    const logsRef = collection(db, 'admin_logs');
    const logsQuery = query(
      logsRef,
      where('clinicId', '==', clinicId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      logsQuery,
      (querySnapshot) => {
        const logEvents: AdminLogEvent[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // Convert timestamp to Date
          const timestamp = data.timestamp 
            ? new Date(data.timestamp.seconds * 1000) 
            : new Date();

          const event: AdminLogEvent = {
            id: doc.id,
            clinicId: data.clinicId,
            timestamp,
            actionType: data.actionType || 'unknown',
            adminId: data.adminId || 'system',
            adminName: data.adminName,
            details: data.details || {},
            notes: data.notes,
          };

          logEvents.push(event);
        });

        setLogs(logEvents);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching admin logs:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId]);

  return { logs, loading, error };
};

export default useLogs;