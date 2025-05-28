import React, { useState } from 'react';
import { 
  ClipboardDocumentListIcon,
  PlusCircleIcon,
  XMarkIcon,
  PencilSquareIcon,
  TagIcon,
  CheckCircleIcon,
  CreditCardIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { AdminLogEvent } from '../../../../utils/hooks/useLogs';
import { db } from '../../../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Clinic } from '../../../../utils/hooks/useClinic';

interface AdminNotesProps {
  logs: AdminLogEvent[];
  clinic: Clinic;
  loading: boolean;
  refreshData: () => void;
}

type ActionType = 'all' | 'status_change' | 'plan_change' | 'tag_add' | 'tag_remove' | 'note_add' | 'manual_log';

const AdminNotes: React.FC<AdminNotesProps> = ({
  logs,
  clinic,
  loading,
  refreshData
}) => {
  const [actionFilter, setActionFilter] = useState<ActionType>('all');
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [logNote, setLogNote] = useState('');
  const [actionType, setActionType] = useState('manual_log');
  const [submitting, setSubmitting] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredLogs = () => {
    if (actionFilter === 'all') return logs;
    return logs.filter(log => log.actionType === actionFilter);
  };

  const getActionTypeIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <CheckCircleIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      case 'plan_change':
      case 'plan_cancel':
      case 'plan_reactivate':
        return <CreditCardIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />;
      case 'tag_add':
      case 'tag_remove':
        return <TagIcon className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />;
      case 'note_add':
        return <PencilSquareIcon className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'email_sent':
      case 'sms_sent':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-indigo-500 dark:text-indigo-400" />;
      case 'manual_log':
        return <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
      default:
        return <ClipboardDocumentListIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getActionDescription = (log: AdminLogEvent) => {
    switch (log.actionType) {
      case 'status_change':
        return `Status changed from ${log.details?.oldStatus || 'unknown'} to ${log.details?.newStatus || 'unknown'}`;
      case 'plan_change':
        return `Plan changed from ${log.details?.oldPlan || 'Free'} to ${log.details?.newPlan || 'unknown'}`;
      case 'plan_cancel':
        return `Plan canceled: ${log.details?.canceledPlan || 'unknown'} (Reason: ${log.details?.reason || 'Not specified'})`;
      case 'plan_reactivate':
        return `Plan reactivated: ${log.details?.plan || 'unknown'}`;
      case 'tag_add':
        return `Tag added: ${log.details?.tag || 'unknown'}`;
      case 'tag_remove':
        return `Tag removed: ${log.details?.tag || 'unknown'}`;
      case 'note_add':
        return `Internal note added: ${log.details?.noteContent || ''}`;
      case 'email_sent':
        return `Email sent to ${log.details?.recipient || 'clinic'}: ${log.details?.subject || 'No subject'}`;
      case 'sms_sent':
        return `SMS sent to ${log.details?.recipient || 'clinic'}`;
      case 'manual_log':
        return log.notes || 'Manual log entry';
      default:
        return log.notes || 'Unknown action';
    }
  };

  const getFilterClass = (currentValue: string, filterValue: string) => {
    return currentValue === filterValue
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
  };

  const handleAddLog = async () => {
    if (!logNote.trim()) return;
    
    setSubmitting(true);
    try {
      const now = new Date();
      
      // Add to admin_logs collection
      await addDoc(collection(db, 'admin_logs'), {
        clinicId: clinic.id,
        timestamp: Timestamp.fromDate(now),
        actionType: actionType,
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User', // Replace with actual admin name
        notes: logNote.trim()
      });
      
      setLogNote('');
      setShowAddLogModal(false);
      refreshData();
    } catch (error) {
      console.error('Error adding log:', error);
      alert('Failed to add log. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = getFilteredLogs();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
            Admin Activity Log
          </h2>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowAddLogModal(true)}
              className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <PlusCircleIcon className="h-4 w-4 mr-1" />
              Add Log
            </button>
            
            <button
              onClick={refreshData}
              className="inline-flex items-center px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="mb-6 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Filter by Action Type:</h3>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActionFilter('all')}
              className={`px-2 py-1 text-xs rounded-full ${getFilterClass(actionFilter, 'all')}`}
            >
              All
            </button>
            <button
              onClick={() => setActionFilter('status_change')}
              className={`px-2 py-1 text-xs rounded-full ${getFilterClass(actionFilter, 'status_change')}`}
            >
              Status Change
            </button>
            <button
              onClick={() => setActionFilter('plan_change')}
              className={`px-2 py-1 text-xs rounded-full ${getFilterClass(actionFilter, 'plan_change')}`}
            >
              Plan Change
            </button>
            <button
              onClick={() => setActionFilter('tag_add')}
              className={`px-2 py-1 text-xs rounded-full ${getFilterClass(actionFilter, 'tag_add')}`}
            >
              Tag Added
            </button>
            <button
              onClick={() => setActionFilter('tag_remove')}
              className={`px-2 py-1 text-xs rounded-full ${getFilterClass(actionFilter, 'tag_remove')}`}
            >
              Tag Removed
            </button>
            <button
              onClick={() => setActionFilter('note_add')}
              className={`px-2 py-1 text-xs rounded-full ${getFilterClass(actionFilter, 'note_add')}`}
            >
              Notes
            </button>
            <button
              onClick={() => setActionFilter('manual_log')}
              className={`px-2 py-1 text-xs rounded-full ${getFilterClass(actionFilter, 'manual_log')}`}
            >
              Manual Logs
            </button>
          </div>
        </div>
        
        {/* Log List */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <ClipboardDocumentListIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No logs found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {actionFilter !== 'all'
                ? 'Try changing your filter to see more logs'
                : 'There are no admin logs for this clinic yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700 border-l-4 border-gray-400 dark:border-gray-500"
              >
                <div className="flex justify-between mb-2">
                  <div className="flex items-center">
                    {getActionTypeIcon(log.actionType)}
                    <span className="ml-2 font-medium text-gray-900 dark:text-white capitalize">
                      {log.actionType.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(log.timestamp)}
                  </div>
                </div>
                
                <div className="mb-2 text-gray-800 dark:text-gray-200">
                  {getActionDescription(log)}
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <UserCircleIcon className="h-4 w-4 mr-1" />
                  {log.adminName || 'Admin'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Log Modal */}
      {showAddLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Log Entry</h3>
              <button
                onClick={() => setShowAddLogModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Action Type:
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="manual_log">Manual Log</option>
                  <option value="support_contact">Support Contact</option>
                  <option value="client_meeting">Client Meeting</option>
                  <option value="website_check">Website Check</option>
                  <option value="profile_review">Profile Review</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Log Entry:
                </label>
                <textarea
                  value={logNote}
                  onChange={(e) => setLogNote(e.target.value)}
                  placeholder="Enter log details..."
                  className="w-full h-32 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddLogModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLog}
                disabled={!logNote.trim() || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Log'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotes;