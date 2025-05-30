import React, { useState } from 'react';
import { Affiliate } from '../../../lib/models/affiliate';
import { updateAffiliate } from '../../../lib/api/affiliateService';
import { PaperClipIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Timestamp } from 'firebase/firestore';

interface AffiliateNotesSectionProps {
  affiliate: Affiliate;
}

const AffiliateNotesSection: React.FC<AffiliateNotesSectionProps> = ({ affiliate }) => {
  const [notes, setNotes] = useState<string[]>(affiliate.notes || []);
  const [newNote, setNewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Format date for display
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Add a new note
  const addNote = async () => {
    if (!newNote.trim() || !affiliate.id) return;
    
    try {
      setIsSubmitting(true);
      
      // Add the new note to the array
      const updatedNotes = [...notes, newNote.trim()];
      
      // Update in Firestore
      await updateAffiliate(affiliate.id, {
        notes: updatedNotes
      });
      
      // Update local state
      setNotes(updatedNotes);
      setNewNote('');
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Remove a note
  const removeNote = async (index: number) => {
    if (!affiliate.id) return;
    
    try {
      setIsSubmitting(true);
      
      // Remove the note from the array
      const updatedNotes = [...notes];
      updatedNotes.splice(index, 1);
      
      // Update in Firestore
      await updateAffiliate(affiliate.id, {
        notes: updatedNotes
      });
      
      // Update local state
      setNotes(updatedNotes);
    } catch (error) {
      console.error('Error removing note:', error);
      alert('Failed to remove note. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Notes Section */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Notes
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Internal notes about this affiliate partner.
            </p>
          </div>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          {/* New note form */}
          <div className="mb-6">
            <label htmlFor="new-note" className="sr-only">
              Add Note
            </label>
            <div>
              <textarea
                id="new-note"
                name="new-note"
                rows={3}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                placeholder="Add a new note about this affiliate..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={addNote}
                disabled={!newNote.trim() || isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Note
              </button>
            </div>
          </div>
          
          {/* Note list */}
          {notes.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              No notes added yet. Add a note to keep track of important information about this affiliate.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {notes.map((note, index) => (
                <li key={index} className="py-4">
                  <div className="flex space-x-3">
                    <div className="flex-shrink-0">
                      <PaperClipIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{note}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => removeNote(index)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
      {/* Activity History */}
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Activity History
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Timeline of affiliate activity and changes.
          </p>
        </div>
        
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="flow-root">
            <ul className="-mb-8">
              <li>
                <div className="relative pb-8">
                  <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                  <div className="relative flex items-start space-x-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center ring-8 ring-white">
                        <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div>
                        <div className="text-sm">
                          <span className="font-medium text-gray-900">Affiliate Created</span>
                        </div>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {formatDate(affiliate.createdAt)}
                        </p>
                      </div>
                      <div className="mt-2 text-sm text-gray-700">
                        <p>
                          Affiliate account was created with code <span className="font-mono">{affiliate.code}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              
              {affiliate.stats.lastReferral && (
                <li>
                  <div className="relative pb-8">
                    <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">Last Referral</span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {formatDate(affiliate.stats.lastReferral)}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <p>
                            Last referral click was recorded
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )}
              
              {affiliate.stats.lastPayout && (
                <li>
                  <div className="relative">
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <span className="font-medium text-gray-900">Last Payout</span>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {formatDate(affiliate.stats.lastPayout.date)}
                          </p>
                        </div>
                        <div className="mt-2 text-sm text-gray-700">
                          <p>
                            Payout of ${affiliate.stats.lastPayout.amount.toFixed(2)} was processed
                            {affiliate.stats.lastPayout.reference ? ` (Ref: ${affiliate.stats.lastPayout.reference})` : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateNotesSection;