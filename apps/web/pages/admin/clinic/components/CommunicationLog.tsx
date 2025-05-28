import React, { useState } from 'react';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  PaperAirplaneIcon,
  PlusCircleIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { Clinic } from '../../../../utils/hooks/useClinic';
import { CommunicationEvent } from '../../../../utils/hooks/useComms';
import { db } from '../../../../lib/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

interface CommunicationLogProps {
  clinic: Clinic;
  comms: CommunicationEvent[];
  loading: boolean;
  refreshData: () => void;
}

type FilterType = 'all' | 'email' | 'sms' | 'note' | 'call';
type DirectionType = 'all' | 'inbound' | 'outbound' | 'internal';

const CommunicationLog: React.FC<CommunicationLogProps> = ({
  clinic,
  comms,
  loading,
  refreshData
}) => {
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [directionFilter, setDirectionFilter] = useState<DirectionType>('all');
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showComposeMessage, setShowComposeMessage] = useState(false);
  const [messageType, setMessageType] = useState<'email' | 'sms'>('email');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredComms = () => {
    return comms.filter(comm => {
      const typeMatch = typeFilter === 'all' || comm.type === typeFilter;
      const directionMatch = directionFilter === 'all' || comm.direction === directionFilter;
      return typeMatch && directionMatch;
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <EnvelopeIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />;
      case 'sms':
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-500 dark:text-green-400" />;
      case 'call':
        return <PhoneIcon className="h-5 w-5 text-purple-500 dark:text-purple-400" />;
      case 'note':
        return <PencilSquareIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
      default:
        return <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  const getDirectionClass = (direction: string) => {
    switch (direction) {
      case 'inbound':
        return 'bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 dark:border-blue-600';
      case 'outbound':
        return 'bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 dark:border-green-600';
      case 'internal':
        return 'bg-gray-50 dark:bg-gray-700 border-l-4 border-gray-400 dark:border-gray-500';
      default:
        return 'bg-gray-50 dark:bg-gray-700';
    }
  };

  const getFilterClass = (currentValue: string, filterValue: string) => {
    return currentValue === filterValue
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600';
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setSubmitting(true);
    try {
      const now = new Date();
      
      // Add to communications collection
      await addDoc(collection(db, 'communications'), {
        clinicId: clinic.id,
        timestamp: Timestamp.fromDate(now),
        type: 'note',
        direction: 'internal',
        sender: 'Admin User', // Replace with actual admin name
        recipient: 'Internal',
        content: newNote.trim(),
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User' // Replace with actual admin name
      });
      
      // Log admin action
      await addDoc(collection(db, 'admin_logs'), {
        clinicId: clinic.id,
        timestamp: Timestamp.fromDate(now),
        actionType: 'note_add',
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User', // Replace with actual admin name
        details: {
          noteContent: newNote.trim().substring(0, 50) + (newNote.length > 50 ? '...' : '')
        }
      });
      
      setNewNote('');
      setShowAddNote(false);
      refreshData();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageContent.trim() || (messageType === 'email' && !messageSubject.trim())) return;
    
    setSubmitting(true);
    try {
      const now = new Date();
      
      // In a real app, this would call an API to send an email or SMS
      // For now, we'll just log it in the communications collection
      
      // Add to communications collection
      await addDoc(collection(db, 'communications'), {
        clinicId: clinic.id,
        timestamp: Timestamp.fromDate(now),
        type: messageType,
        direction: 'outbound',
        sender: 'Admin User', // Replace with actual admin name
        recipient: messageType === 'email' ? clinic.email : clinic.phone,
        subject: messageType === 'email' ? messageSubject : undefined,
        content: messageContent.trim(),
        status: 'delivered', // In a real app, this would be 'pending' until confirmed
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User' // Replace with actual admin name
      });
      
      // Log admin action
      await addDoc(collection(db, 'admin_logs'), {
        clinicId: clinic.id,
        timestamp: Timestamp.fromDate(now),
        actionType: `${messageType}_sent`,
        adminId: 'current_admin', // Replace with actual admin ID
        adminName: 'Admin User', // Replace with actual admin name
        details: {
          recipient: messageType === 'email' ? clinic.email : clinic.phone,
          subject: messageType === 'email' ? messageSubject : undefined,
          messageContent: messageContent.trim().substring(0, 50) + (messageContent.length > 50 ? '...' : '')
        }
      });
      
      setMessageSubject('');
      setMessageContent('');
      setShowComposeMessage(false);
      refreshData();
    } catch (error) {
      console.error(`Error sending ${messageType}:`, error);
      alert(`Failed to send ${messageType}. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredComms = getFilteredComms();

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-0">
            Communication Log
          </h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowAddNote(true)}
              className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <PencilSquareIcon className="h-4 w-4 mr-1" />
              Add Note
            </button>
            
            <button
              onClick={() => {
                setMessageType('email');
                setShowComposeMessage(true);
              }}
              className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              disabled={!clinic.email}
              title={clinic.email ? 'Send Email' : 'No email address available'}
            >
              <EnvelopeIcon className="h-4 w-4 mr-1" />
              Email
            </button>
            
            <button
              onClick={() => {
                setMessageType('sms');
                setShowComposeMessage(true);
              }}
              className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
              disabled={!clinic.phone}
              title={clinic.phone ? 'Send SMS' : 'No phone number available'}
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
              SMS
            </button>
            
            <button
              onClick={refreshData}
              className="inline-flex items-center px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Type:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              <button
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 text-xs rounded-full ${getFilterClass(typeFilter, 'all')}`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('email')}
                className={`px-2 py-1 text-xs rounded-full ${getFilterClass(typeFilter, 'email')}`}
              >
                Email
              </button>
              <button
                onClick={() => setTypeFilter('sms')}
                className={`px-2 py-1 text-xs rounded-full ${getFilterClass(typeFilter, 'sms')}`}
              >
                SMS
              </button>
              <button
                onClick={() => setTypeFilter('call')}
                className={`px-2 py-1 text-xs rounded-full ${getFilterClass(typeFilter, 'call')}`}
              >
                Call
              </button>
              <button
                onClick={() => setTypeFilter('note')}
                className={`px-2 py-1 text-xs rounded-full ${getFilterClass(typeFilter, 'note')}`}
              >
                Note
              </button>
            </div>
          </div>
          
          <div>
            <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Direction:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              <button
                onClick={() => setDirectionFilter('all')}
                className={`px-2 py-1 text-xs rounded-full ${getFilterClass(directionFilter, 'all')}`}
              >
                All
              </button>
              <button
                onClick={() => setDirectionFilter('inbound')}
                className={`px-2 py-1 text-xs rounded-full ${getFilterClass(directionFilter, 'inbound')}`}
              >
                Inbound
              </button>
              <button
                onClick={() => setDirectionFilter('outbound')}
                className={`px-2 py-1 text-xs rounded-full ${getFilterClass(directionFilter, 'outbound')}`}
              >
                Outbound
              </button>
              <button
                onClick={() => setDirectionFilter('internal')}
                className={`px-2 py-1 text-xs rounded-full ${getFilterClass(directionFilter, 'internal')}`}
              >
                Internal
              </button>
            </div>
          </div>
        </div>
        
        {/* Communication List */}
        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        ) : filteredComms.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
            <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No communications found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {typeFilter !== 'all' || directionFilter !== 'all'
                ? 'Try changing your filters to see more communications'
                : 'There are no communications with this clinic yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {filteredComms.map((comm) => (
              <div 
                key={comm.id} 
                className={`p-4 rounded-lg ${getDirectionClass(comm.direction)}`}
              >
                <div className="flex justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(comm.type)}
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comm.type.charAt(0).toUpperCase() + comm.type.slice(1)}
                      {comm.type === 'email' && comm.subject && `: ${comm.subject}`}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(comm.timestamp)}
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="text-sm">
                    {comm.direction === 'inbound' ? (
                      <span className="text-blue-600 dark:text-blue-400">From: {comm.sender}</span>
                    ) : comm.direction === 'outbound' ? (
                      <span className="text-green-600 dark:text-green-400">To: {comm.recipient}</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">Internal note by {comm.adminName || comm.sender}</span>
                    )}
                  </div>
                </div>
                
                <div className="text-gray-800 dark:text-gray-200 break-words">
                  {comm.content}
                </div>
                
                {comm.status && comm.direction === 'outbound' && (
                  <div className="mt-2 text-sm">
                    <span className={`px-2 py-0.5 rounded-full ${
                      comm.status === 'delivered'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : comm.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Note Modal */}
      {showAddNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Add Internal Note</h3>
              <button
                onClick={() => setShowAddNote(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here..."
                className="w-full h-32 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddNote(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Compose Message Modal */}
      {showComposeMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {messageType === 'email' ? 'Compose Email' : 'Compose SMS'}
              </h3>
              <button
                onClick={() => setShowComposeMessage(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To:
                </label>
                <input
                  type="text"
                  value={messageType === 'email' ? clinic.email : clinic.phone}
                  disabled
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-600 dark:text-gray-300"
                />
              </div>
              
              {messageType === 'email' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject:
                  </label>
                  <input
                    type="text"
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    placeholder="Enter subject..."
                    className="w-full px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Message:
                </label>
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full h-32 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-400 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowComposeMessage(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || (messageType === 'email' && !messageSubject.trim()) || submitting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {submitting ? 'Sending...' : `Send ${messageType === 'email' ? 'Email' : 'SMS'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommunicationLog;