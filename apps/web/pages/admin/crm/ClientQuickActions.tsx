import React, { useState } from 'react';
import { 
  PencilSquareIcon, 
  PauseCircleIcon, 
  PlayCircleIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Clinic } from '../../../types';

interface ClientQuickActionsProps {
  clinic: Clinic;
  onEdit: (clinic: Clinic) => void;
  onMessage: (clinic: Clinic) => void;
  onStatusChange: (clinic: Clinic, newStatus: 'active' | 'paused' | 'trial' | 'canceled') => void;
  availableTags: string[];
  onTagsChange: (clinic: Clinic, newTags: string[]) => void;
  refreshData: () => void;
}

const ClientQuickActions: React.FC<ClientQuickActionsProps> = ({
  clinic,
  onEdit,
  onMessage,
  onStatusChange,
  availableTags,
  onTagsChange,
  refreshData
}) => {
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    try {
      const newStatus = clinic.status === 'active' ? 'paused' : 'active';
      if (!clinic.id) throw new Error('Clinic ID is required');
      await updateDoc(doc(db, 'clinics', clinic.id), { status: newStatus });
      onStatusChange(clinic, newStatus);
      refreshData();
    } catch (error) {
      console.error('Error updating clinic status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = async (tag: string) => {
    let newTags = [...clinic.tags || []];
    
    if (newTags.includes(tag)) {
      newTags = newTags.filter(t => t !== tag);
    } else {
      newTags.push(tag);
    }

    try {
      if (!clinic.id) throw new Error('Clinic ID is required');
      await updateDoc(doc(db, 'clinics', clinic.id), { tags: newTags });
      onTagsChange(clinic, newTags);
      refreshData();
    } catch (error) {
      console.error('Error updating clinic tags:', error);
    }
  };

  return (
    <div className="flex items-center space-x-1 relative">
      {/* Action Buttons */}
      <button
        onClick={() => onEdit(clinic)}
        className="p-1 text-gray-400 hover:text-blue-400 rounded-full hover:bg-blue-900/30 transition-colors"
        title="Edit Clinic"
      >
        <PencilSquareIcon className="h-5 w-5" />
      </button>
      
      <button
        onClick={toggleStatus}
        disabled={loading}
        className={`p-1 rounded-full transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : clinic.status === 'active' ? 'text-green-400 hover:text-red-400 hover:bg-red-900/30' : 'text-red-400 hover:text-green-400 hover:bg-green-900/30'}`}
        title={clinic.status === 'active' ? 'Pause Clinic' : 'Activate Clinic'}
      >
        {clinic.status === 'active' ? (
          <PauseCircleIcon className="h-5 w-5" />
        ) : (
          <PlayCircleIcon className="h-5 w-5" />
        )}
      </button>
      
      <button
        onClick={() => onMessage(clinic)}
        className="p-1 text-gray-400 hover:text-blue-400 rounded-full hover:bg-blue-900/30 transition-colors"
        title="Message Clinic"
      >
        <ChatBubbleLeftRightIcon className="h-5 w-5" />
      </button>
      
      <div className="relative">
        <button
          onClick={() => setShowTagMenu(!showTagMenu)}
          className="p-1 text-gray-400 hover:text-blue-400 rounded-full hover:bg-blue-900/30 transition-colors"
          title="Manage Tags"
        >
          <TagIcon className="h-5 w-5" />
        </button>
        
        {showTagMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-[#111111] rounded-md shadow-lg z-50 py-1 border border-[#222222]">
            <div className="p-2 border-b border-[#222222] text-xs font-medium text-gray-400">
              Manage Tags
            </div>
            <div className="max-h-48 overflow-y-auto p-2">
              {availableTags.map(tag => (
                <div key={tag} className="flex items-center mb-1">
                  <input
                    type="checkbox"
                    id={`tag-${tag}`}
                    checked={clinic.tags?.includes(tag) || false}
                    onChange={() => handleTagToggle(tag)}
                    className="mr-2"
                  />
                  <label htmlFor={`tag-${tag}`} className="text-sm text-gray-300 select-none">
                    {tag}
                  </label>
                </div>
              ))}
            </div>
            <button 
              onClick={() => setShowTagMenu(false)}
              className="w-full text-center p-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white border-t border-[#222222] transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
      
      {/* More Options Button */}
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-1 text-gray-400 hover:text-gray-300 rounded-full hover:bg-gray-800 transition-colors"
        >
          <EllipsisHorizontalIcon className="h-5 w-5" />
        </button>
        
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-[#111111] rounded-md shadow-lg z-50 border border-[#222222]">
            <div className="py-1">
              <button 
                onClick={() => {
                  window.open(`/clinic/${clinic.id}`, '_blank');
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                View Public Profile
              </button>
              <button 
                onClick={() => {
                  window.location.href = `/admin/clinic/${clinic.id}`;
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                View Full Details
              </button>
              <button 
                onClick={() => {
                  // Implement logic to download clinic data
                  setShowMenu(false);
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
              >
                Export Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientQuickActions;