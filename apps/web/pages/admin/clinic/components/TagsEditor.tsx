import React, { useState, useEffect, useRef } from 'react';
import { XCircleIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { doc, updateDoc, arrayUnion, arrayRemove, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { Clinic } from '../../../../utils/hooks/useClinic';

interface TagsEditorProps {
  clinic: Clinic;
  onClose: () => void;
  onSave: () => void;
}

const TagsEditor: React.FC<TagsEditorProps> = ({
  clinic,
  onClose,
  onSave
}) => {
  const [tags, setTags] = useState<string[]>(clinic.tags || []);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Common system tags
  const commonTags = [
    'verified',
    'website-down',
    'geo-mismatch',
    'needs-review',
    'premium-candidate',
    'featured',
    'missing-data',
    'special-offer',
    'high-traffic',
    'low-engagement',
    'recently-updated'
  ];

  // Focus on input when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    // Normalize tag format: lowercase, hyphens instead of spaces
    const formattedTag = newTag.trim().toLowerCase().replace(/\s+/g, '-');
    
    if (tags.includes(formattedTag)) {
      setNewTag('');
      return;
    }

    setLoading(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, 'clinics', clinic.id), {
        tags: arrayUnion(formattedTag)
      });
      
      // Log the action
      try {
        await addDoc(collection(db, 'admin_logs'), {
          clinicId: clinic.id,
          timestamp: new Date(),
          actionType: 'tag_add',
          adminId: 'current_admin', // Replace with actual admin ID
          adminName: 'Admin User', // Replace with actual admin name
          details: { tag: formattedTag }
        });
      } catch (logError) {
        console.error('Failed to log tag addition:', logError);
      }
      
      // Update local state
      setTags([...tags, formattedTag]);
      setNewTag('');
    } catch (error) {
      console.error('Error adding tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    setLoading(true);
    try {
      // Update Firestore
      await updateDoc(doc(db, 'clinics', clinic.id), {
        tags: arrayRemove(tagToRemove)
      });
      
      // Log the action
      try {
        await addDoc(collection(db, 'admin_logs'), {
          clinicId: clinic.id,
          timestamp: new Date(),
          actionType: 'tag_remove',
          adminId: 'current_admin', // Replace with actual admin ID
          adminName: 'Admin User', // Replace with actual admin name
          details: { tag: tagToRemove }
        });
      } catch (logError) {
        console.error('Failed to log tag removal:', logError);
      }
      
      // Update local state
      setTags(tags.filter(tag => tag !== tagToRemove));
    } catch (error) {
      console.error('Error removing tag:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    onSave();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  const handleCommonTagSelect = (tag: string) => {
    setNewTag(tag);
  };

  // Filter common tags to show only those not already added
  const availableCommonTags = commonTags.filter(tag => !tags.includes(tag));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Manage Tags</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <label htmlFor="new-tag" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Add New Tag
          </label>
          <div className="flex">
            <input
              ref={inputRef}
              type="text"
              id="new-tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter tag name"
              className="flex-1 rounded-l-md border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={loading}
            />
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim() || loading}
              className="bg-blue-600 text-white px-3 py-2 rounded-r-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Common Tag Suggestions */}
        {availableCommonTags.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Common Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {availableCommonTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleCommonTagSelect(tag)}
                  className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Current Tags
          </p>
          {tags.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No tags added yet
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <div 
                  key={tag} 
                  className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    disabled={loading}
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-6 space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagsEditor;