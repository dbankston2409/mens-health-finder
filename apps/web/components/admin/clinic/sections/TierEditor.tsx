import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { Clinic } from '@/types';
import { 
  generateTierFeatures, 
  convertToStandardTier, 
  getTierDisplayName 
} from '@/utils/tierUtils';

interface TierEditorProps {
  clinic: Clinic;
  onUpdate?: (updatedClinic: Clinic) => void;
}

const TierEditor: React.FC<TierEditorProps> = ({ clinic, onUpdate }) => {
  const [selectedTier, setSelectedTier] = useState<'free' | 'standard' | 'advanced'>(
    clinic.tier || convertToStandardTier(clinic.package || clinic.packageTier)
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Reset messages when tier changes
  useEffect(() => {
    setSuccess(false);
    setError(null);
  }, [selectedTier]);
  
  // Handle tier change
  const handleTierChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTier(e.target.value as 'free' | 'standard' | 'advanced');
  };
  
  // Save tier changes
  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    
    try {
      // Generate tier features based on selected tier
      const tierFeatures = generateTierFeatures(selectedTier);
      
      // Get Firestore reference
      const db = getFirestore();
      const clinicRef = doc(db, 'clinics', clinic.id || '');
      
      // Update the document
      await updateDoc(clinicRef, {
        tier: selectedTier,
        tierFeatures,
        lastUpdated: new Date()
      });
      
      // Show success message
      setSuccess(true);
      
      // Notify parent component if callback provided
      if (onUpdate) {
        onUpdate({
          ...clinic,
          tier: selectedTier,
          tierFeatures
        });
      }
    } catch (err) {
      console.error('Error updating tier:', err);
      setError('Failed to update tier. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Get tier details for display
  const getTierDetails = (tier: 'free' | 'standard' | 'advanced') => {
    const features = generateTierFeatures(tier);
    
    const pricing = {
      free: 'Free',
      standard: '$199/month',
      advanced: '$399/month'
    };
    
    const description = {
      free: 'Basic listing with limited visibility',
      standard: 'Enhanced listing with standard features',
      advanced: 'Premium listing with maximum visibility and all features'
    };
    
    return { features, pricing: pricing[tier], description: description[tier] };
  };
  
  // Get details for the currently selected tier
  const tierDetails = getTierDetails(selectedTier);
  
  return (
    <div className="card bg-[#222] p-6 rounded-xl">
      <h3 className="text-xl font-semibold mb-4">Tier Management</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Current Tier
        </label>
        <div className="flex items-center">
          <select
            value={selectedTier}
            onChange={handleTierChange}
            className="select bg-[#333] border-[#444] rounded mr-3 flex-grow"
          >
            <option value="free">Free</option>
            <option value="standard">Standard</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={handleSave}
            disabled={loading || selectedTier === clinic.tier}
            className={`btn px-4 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
        
        {success && (
          <p className="text-green-500 text-sm mt-2">
            Tier updated successfully!
          </p>
        )}
        
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
      
      <div className="bg-[#1A1A1A] rounded-lg p-4 mb-6">
        <h4 className="text-lg font-medium mb-2">
          {getTierDisplayName(selectedTier)} Tier
        </h4>
        <p className="text-gray-400 text-sm mb-2">{tierDetails.description}</p>
        <p className="text-primary font-semibold mb-4">{tierDetails.pricing}</p>
        
        <h5 className="font-medium text-sm text-gray-300 mb-2">Features</h5>
        <ul className="space-y-2">
          <li className="flex items-center text-sm">
            <svg
              className={`w-4 h-4 mr-2 ${
                tierDetails.features.fullProfile ? 'text-green-500' : 'text-gray-500'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {tierDetails.features.fullProfile ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            Full Profile
          </li>
          <li className="flex items-center text-sm">
            <svg
              className={`w-4 h-4 mr-2 ${
                tierDetails.features.verifiedBadge ? 'text-green-500' : 'text-gray-500'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {tierDetails.features.verifiedBadge ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            Verified Badge
          </li>
          <li className="flex items-center text-sm">
            <svg
              className={`w-4 h-4 mr-2 ${
                tierDetails.features.enhancedSearch ? 'text-green-500' : 'text-gray-500'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {tierDetails.features.enhancedSearch ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            Enhanced Search Visibility
          </li>
          <li className="flex items-center text-sm">
            <svg
              className={`w-4 h-4 mr-2 ${
                tierDetails.features.priorityListing ? 'text-green-500' : 'text-gray-500'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {tierDetails.features.priorityListing ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            Priority Listing
          </li>
          <li className="flex items-center text-sm">
            <svg
              className={`w-4 h-4 mr-2 ${
                tierDetails.features.customTracking ? 'text-green-500' : 'text-gray-500'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {tierDetails.features.customTracking ? (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              )}
            </svg>
            Custom Call Tracking
          </li>
          <li className="flex items-center text-sm">
            <span className="mr-2 text-gray-400">Treatments:</span>
            <span className="text-gray-300">{tierDetails.features.treatmentsLimit}</span>
          </li>
          <li className="flex items-center text-sm">
            <span className="mr-2 text-gray-400">Review Display:</span>
            <span className="text-gray-300">{tierDetails.features.reviewDisplay}</span>
          </li>
        </ul>
      </div>
      
      <div className="bg-[#1A1A1A] rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Legacy Tier Values</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Package:</span>{' '}
            <span className="text-gray-300">{clinic.package || 'Not set'}</span>
          </div>
          <div>
            <span className="text-gray-400">PackageTier:</span>{' '}
            <span className="text-gray-300">{clinic.packageTier || 'Not set'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierEditor;