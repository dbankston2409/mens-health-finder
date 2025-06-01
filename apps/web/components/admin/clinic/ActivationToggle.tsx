import React, { useState } from 'react';
import FirestoreClient from '../../../lib/firestoreClient';

interface ActivationToggleProps {
  clinicId: string;
  isActive: boolean;
  onUpdate: () => void;
}

const ActivationToggle: React.FC<ActivationToggleProps> = ({ 
  clinicId, 
  isActive,
  onUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleToggle = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const success = await FirestoreClient.setClinicActive(clinicId, !isActive);
      
      if (success) {
        onUpdate();
      } else {
        setError('Failed to update clinic status');
      }
    } catch (err) {
      console.error('Error toggling clinic active status:', err);
      setError('An error occurred while updating clinic status');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          isActive ? 'bg-green-600' : 'bg-gray-600'
        }`}
        role="switch"
        aria-checked={isActive}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            isActive ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      
      <span className="font-medium">
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
        ) : isActive ? (
          <span className="text-green-500">Active</span>
        ) : (
          <span className="text-gray-500">Inactive</span>
        )}
      </span>
      
      {error && (
        <span className="text-red-500 text-sm">{error}</span>
      )}
    </div>
  );
};

export default ActivationToggle;