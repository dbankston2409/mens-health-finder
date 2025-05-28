import React, { useState } from 'react';
import { 
  PencilSquareIcon, 
  PauseCircleIcon, 
  PlayCircleIcon,
  ChatBubbleLeftRightIcon, 
  TagIcon,
  PhoneIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { Clinic } from '../../../../utils/hooks/useClinic';
import TagsEditor from './TagsEditor';

interface ClinicHeaderProps {
  clinic: Clinic;
  onEditClinic: () => void;
  onMessageClinic: () => void;
  refreshData: () => void;
}

const ClinicHeader: React.FC<ClinicHeaderProps> = ({
  clinic,
  onEditClinic,
  onMessageClinic,
  refreshData
}) => {
  const [loading, setLoading] = useState(false);
  const [showTagsEditor, setShowTagsEditor] = useState(false);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'trial':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'canceled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPackageBadgeClass = (packageTier: string) => {
    switch (packageTier.toLowerCase()) {
      case 'premium':
      case 'pro':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'basic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'free':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleStatus = async () => {
    if (!clinic) return;
    
    setLoading(true);
    try {
      const newStatus = clinic.status === 'active' ? 'paused' : 'active';
      await updateDoc(doc(db, 'clinics', clinic.id), { status: newStatus });
      
      // Also log this action
      try {
        const logRef = collection(db, 'admin_logs');
        await addDoc(logRef, {
          clinicId: clinic.id,
          timestamp: new Date(),
          actionType: 'status_change',
          adminId: 'current_admin', // This should be replaced with the actual admin ID
          adminName: 'Admin User', // This should be replaced with the actual admin name
          details: {
            oldStatus: clinic.status,
            newStatus: newStatus
          }
        });
      } catch (logError) {
        console.error('Failed to log status change:', logError);
      }
      
      refreshData();
    } catch (error) {
      console.error('Error updating clinic status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!clinic) return null;

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-5 mb-6 sticky top-0 z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0">
            <div className="flex items-center flex-wrap gap-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mr-2">
                {clinic.name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPackageBadgeClass(clinic.packageTier)}`}>
                {clinic.packageTier}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadgeClass(clinic.status)}`}>
                {clinic.status.charAt(0).toUpperCase() + clinic.status.slice(1)}
              </span>
            </div>
            
            <div className="text-gray-600 dark:text-gray-300 mt-2 space-y-1">
              <div className="flex items-center">
                <span className="text-sm">{clinic.city}, {clinic.state}</span>
              </div>
              
              {clinic.phone && (
                <div className="flex items-center">
                  <PhoneIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                  <a 
                    href={`tel:${clinic.phone}`} 
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {clinic.phone}
                  </a>
                </div>
              )}
              
              {clinic.website && (
                <div className="flex items-center">
                  <GlobeAltIcon className="h-4 w-4 text-gray-500 dark:text-gray-400 mr-1" />
                  <a 
                    href={clinic.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {clinic.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                  {clinic.websiteStatus && (
                    <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                      clinic.websiteStatus === 'up' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {clinic.websiteStatus === 'up' ? 'Up' : 'Down'}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Tags */}
            {clinic.tags && clinic.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {clinic.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onEditClinic}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <PencilSquareIcon className="h-5 w-5 mr-2" />
              Edit
            </button>
            
            <button
              onClick={toggleStatus}
              disabled={loading}
              className={`inline-flex items-center px-3 py-2 border rounded-md shadow-sm text-sm font-medium ${
                loading 
                  ? 'opacity-50 cursor-not-allowed'
                  : clinic.status === 'active'
                    ? 'bg-yellow-50 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-800'
                    : 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-200 border-green-300 dark:border-green-700 hover:bg-green-100 dark:hover:bg-green-800'
              }`}
            >
              {clinic.status === 'active' ? (
                <>
                  <PauseCircleIcon className="h-5 w-5 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <PlayCircleIcon className="h-5 w-5 mr-2" />
                  Activate
                </>
              )}
            </button>
            
            <button
              onClick={onMessageClinic}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              Message
            </button>
            
            <button
              onClick={() => setShowTagsEditor(true)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <TagIcon className="h-5 w-5 mr-2" />
              Tags
            </button>
          </div>
        </div>
      </div>
      
      {/* Tags Editor Modal */}
      {showTagsEditor && (
        <TagsEditor
          clinic={clinic}
          onClose={() => setShowTagsEditor(false)}
          onSave={() => {
            setShowTagsEditor(false);
            refreshData();
          }}
        />
      )}
    </>
  );
};

export default ClinicHeader;