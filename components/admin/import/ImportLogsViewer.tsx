import React, { useState } from 'react';
import useImportLogs from '../../../utils/hooks/useImportLogs';
import ImportErrorDetails from './ImportErrorDetails';
import { ImportLog } from '../../../lib/firestoreClient';

interface ImportLogsViewerProps {
  pageSize?: number;
}

const ImportLogsViewer: React.FC<ImportLogsViewerProps> = ({ pageSize = 10 }) => {
  const { logs, loading, error, hasMore, loadMore, refreshLogs, retryImport } = useImportLogs(pageSize);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<ImportLog | null>(null);

  const handleRetry = async (logId: string) => {
    setRetryingIds(prev => new Set(prev).add(logId));
    
    try {
      await retryImport(logId);
    } finally {
      setRetryingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(logId);
        return newSet;
      });
    }
  };

  const handleViewErrors = (log: ImportLog) => {
    setSelectedLog(log);
  };

  const filteredLogs = logs.filter(log => {
    if (filterStatus === 'all') return true;
    return log.status === filterStatus;
  });

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Import Logs</h3>
          <p className="mt-1 text-sm text-gray-500">
            View logs for all clinic import operations
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div>
            <label htmlFor="status-filter" className="sr-only">Filter by status</label>
            <select
              id="status-filter"
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="partial">Partial Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => refreshLogs()}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="px-4 py-3 bg-red-50 text-red-700 text-sm">
          <p>Error loading import logs: {error.message}</p>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                File Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Records
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  <div className="flex justify-center items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading logs...</span>
                  </div>
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  No import logs found
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.timestamp.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {log.fileName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${log.status === 'success' ? 'bg-green-100 text-green-800' : 
                        log.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}
                    >
                      {log.status === 'success' ? 'Success' : 
                        log.status === 'partial' ? 'Partial Success' : 
                        'Failed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      Total: {log.totalRecords}
                    </div>
                    <div className="flex space-x-2 text-xs">
                      <span className="text-green-600">{log.successCount} success</span>
                      {log.failureCount > 0 && (
                        <span className="text-red-600">{log.failureCount} failed</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.adminName || log.adminId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 space-y-2">
                    {(log.status === 'failed' || log.status === 'partial') && (
                      <button
                        type="button"
                        onClick={() => handleRetry(log.id)}
                        disabled={retryingIds.has(log.id)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {retryingIds.has(log.id) ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Retrying...
                          </>
                        ) : 'Retry Failed Records'}
                      </button>
                    )}
                    
                    {log.failureCount > 0 && (
                      <button
                        type="button"
                        onClick={() => handleViewErrors(log)}
                        className="block text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        View Error Details
                      </button>
                    )}
                    
                    {log.status === 'success' && log.failureCount === 0 && (
                      <span className="text-xs text-gray-400">No action needed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {hasMore && (
        <div className="px-4 py-3 bg-gray-50 text-center sm:px-6">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
      
      {selectedLog && (
        <ImportErrorDetails
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};

export default ImportLogsViewer;