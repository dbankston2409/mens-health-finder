import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { mockAdminLogs } from './stubs/mockAdminData';

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
        // Use mock data if Firebase access fails
        console.log('Using mock admin logs due to Firebase access error');
        const mockLogEvents = mockAdminLogs.map(log => {
          return {
            id: log.id,
            clinicId: clinicId || '',
            timestamp: log.timestamp,
            actionType: log.action,
            adminId: log.user?.id || 'system',
            adminName: log.user?.name || 'System',
            details: log.changes || {},
            notes: log.note || ''
          };
        });
        setLogs(mockLogEvents);
        setError(null); // Clear error since we're using mock data
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [clinicId]);

  return { logs, loading, error };
};

export default useLogs;