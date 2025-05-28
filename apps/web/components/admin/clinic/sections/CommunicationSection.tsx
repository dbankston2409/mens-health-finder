import React, { useState } from 'react';
import { DetailedClinic } from '../../../../utils/admin/useClinicData';

interface CommunicationSectionProps {
  communication: DetailedClinic['communication'];
  clinic: DetailedClinic;
}

const CommunicationSection: React.FC<CommunicationSectionProps> = ({ communication, clinic }) => {
  const [activeTab, setActiveTab] = useState<'emails' | 'notes'>('emails');
  const [newNote, setNewNote] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmitNote = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would send this to an API
    console.log('Submitting note:', newNote);
    // Clear the form
    setNewNote('');
    // Show success message or update the list
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {/* Tabs */}
      <div className="bg-[#111111] rounded-lg border border-[#222222] shadow-md">
        <div className="flex border-b border-[#222222]">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'emails' ? 'border-primary text-primary' : 'border-transparent hover:border-gray-700'}`}
            onClick={() => setActiveTab('emails')}
          >
            Emails
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === 'notes' ? 'border-primary text-primary' : 'border-transparent hover:border-gray-700'}`}
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'emails' && (
            <div>
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium">Email Communications</h3>
                <button className="px-4 py-2 bg-primary rounded-md hover:bg-primary-dark text-sm">
                  Compose Email
                </button>
              </div>
              
              <div className="space-y-4">
                {communication.emails.length > 0 ? (
                  communication.emails.map((email) => (
                    <div 
                      key={email.id} 
                      className={`p-4 rounded-lg border ${email.read ? 'border-[#222222] bg-[#111111]' : 'border-primary bg-[#111111]'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium mb-1">{email.subject}</div>
                          <div className="text-sm text-gray-400">
                            {email.from} → {email.to}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(email.date)}
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm">
                        {email.snippet}
                      </div>
                      
                      <div className="mt-3 flex justify-end space-x-2">
                        <button className="text-xs text-gray-400 hover:text-white">
                          View Full Email
                        </button>
                        {!email.read && (
                          <button className="text-xs text-gray-400 hover:text-white">
                            Mark as Read
                          </button>
                        )}
                        <button className="text-xs text-gray-400 hover:text-white">
                          Reply
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-6 text-gray-400">
                    <p>No email communications found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Add Note</h3>
                <form onSubmit={handleSubmitNote}>
                  <div className="mb-4">
                    <textarea
                      className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Add a note about this clinic..."
                      rows={4}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary rounded-md hover:bg-primary-dark text-sm"
                      disabled={!newNote.trim()}
                    >
                      Add Note
                    </button>
                  </div>
                </form>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Communication History</h3>
                
                <div className="space-y-4">
                  {communication.notes.length > 0 ? (
                    communication.notes.map((note) => (
                      <div 
                        key={note.id} 
                        className="p-4 rounded-lg border border-[#222222] bg-[#111111]"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-medium">{note.author}</div>
                          <div className="text-xs text-gray-400">
                            {formatDate(note.date)}
                          </div>
                        </div>
                        
                        <div className="text-sm">
                          {note.text}
                        </div>
                        
                        {note.internal && (
                          <div className="mt-2">
                            <span className="text-xs px-2 py-1 bg-blue-900 text-blue-300 rounded-full">
                              Internal Note
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 text-gray-400">
                      <p>No notes found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunicationSection;