import { useState, useEffect } from 'react';
import { DocumentData } from 'firebase/firestore';
import FirestoreClient, { ImportLog } from '../../lib/firestoreClient';

interface UseImportLogsResult {
  logs: ImportLog[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  retryImport: (logId: string) => Promise<boolean>;
}

export const useImportLogs = (initialPageSize = 10): UseImportLogsResult => {
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentData | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [pageSize] = useState<number>(initialPageSize);

  const fetchLogs = async (startAfter: DocumentData | null = null, reset = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await FirestoreClient.getImportLogs(pageSize, startAfter);
      
      setLogs(prev => reset ? result.logs : [...prev, ...result.logs]);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An unknown error occurred'));
      console.error('Error fetching import logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!hasMore || loading) return;
    await fetchLogs(lastDoc);
  };

  const refreshLogs = async () => {
    await fetchLogs(null, true);
  };

  const retryImport = async (logId: string): Promise<boolean> => {
    try {
      const success = await FirestoreClient.retryImport(logId);
      
      if (success) {
        // Refresh logs to show updated status
        await refreshLogs();
      }
      
      return success;
    } catch (err) {
      console.error('Error retrying import:', err);
      return false;
    }
  };

  // Load initial data
  useEffect(() => {
    fetchLogs();
  }, [pageSize]);

  return {
    logs,
    loading,
    error,
    hasMore,
    loadMore,
    refreshLogs,
    retryImport
  };
};

export default useImportLogs;