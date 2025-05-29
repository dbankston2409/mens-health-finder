import React, { useState } from 'react';
import { Clinic } from '@/types';
import { generateTierFeatures, getTierDisplayName } from '@/utils/tierUtils';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface TierEditorProps {
  clinic: Clinic;
  onUpdate: (updatedClinic: Clinic) => void;
}

const TierEditor: React.FC<TierEditorProps> = ({ clinic, onUpdate }) => {
  const [selectedTier, setSelectedTier] = useState<'free' | 'standard' | 'advanced'>(clinic.tier || 'free');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Features available at each tier
  const tierFeatures = generateTierFeatures(selectedTier);
  
  // Handle tier change
  const handleTierChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTier(event.target.value as 'free' | 'standard' | 'advanced');
    setError('');
    setSuccess('');
  };
  
  // Handle save changes
  const handleSave = async () => {
    if (!clinic.id) {
      setError('Clinic ID is missing');
      return;
    }
    
    setIsSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const clinicRef = doc(db, 'clinics', clinic.id);
      const newTierFeatures = generateTierFeatures(selectedTier);
      
      // Update in Firestore
      await updateDoc(clinicRef, {
        tier: selectedTier,
        tierFeatures: newTierFeatures,
        verified: selectedTier !== 'free', // Standard and Advanced tiers are verified
        lastUpdated: new Date()
      });
      
      // Update local state
      const updatedClinic = {
        ...clinic,
        tier: selectedTier,
        tierFeatures: newTierFeatures,
        verified: selectedTier !== 'free'
      };
      
      setSuccess('Tier updated successfully');
      onUpdate(updatedClinic);
    } catch (err) {
      console.error('Error updating tier:', err);
      setError('Failed to update tier');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 mb-6">
      <h3 className="text-xl font-bold mb-4">Tier & Features</h3>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tier
        </label>
        <div className="flex gap-3">
          <select 
            value={selectedTier}
            onChange={handleTierChange}
            className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 w-full text-white"
          >
            <option value="free">Free</option>
            <option value="standard">Standard</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            onClick={handleSave}
            disabled={isSaving || selectedTier === clinic.tier}
            className={`px-4 py-2 rounded-lg font-medium ${
              selectedTier === clinic.tier
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
        {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
        {success && <p className="mt-2 text-green-400 text-sm">{success}</p>}
      </div>
      
      <div className="bg-gray-900 rounded-xl p-4 mb-4">
        <h4 className="font-medium mb-3">Current Tier: {getTierDisplayName(clinic.tier || 'free')}</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="text-sm font-medium text-gray-400 mb-2">Features</h5>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Full Profile Page</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>SEO Description</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Public Contact Info</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>Map Inclusion</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={tierFeatures.verifiedBadge ? "text-green-400" : "text-gray-500"}>
                  {tierFeatures.verifiedBadge ? "✓" : "✗"}
                </span>
                <span>Verified Badge</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={tierFeatures.enhancedSearch ? "text-green-400" : "text-gray-500"}>
                  {tierFeatures.enhancedSearch ? "✓" : "✗"}
                </span>
                <span>Enhanced Search Placement</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h5 className="text-sm font-medium text-gray-400 mb-2">Advanced Features</h5>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className={tierFeatures.enhancedContactUX ? "text-green-400" : "text-gray-500"}>
                  {tierFeatures.enhancedContactUX ? "✓" : "✗"}
                </span>
                <span>Enhanced Contact UX</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={tierFeatures.customTracking ? "text-green-400" : "text-gray-500"}>
                  {tierFeatures.customTracking ? "✓" : "✗"}
                </span>
                <span>Custom Analytics Tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={tierFeatures.snapshotReport ? "text-green-400" : "text-gray-500"}>
                  {tierFeatures.snapshotReport ? "✓" : "✗"}
                </span>
                <span>Snapshot Reports</span>
              </li>
              <li className="flex items-center gap-2">
                <span className={tierFeatures.priorityListing ? "text-green-400" : "text-gray-500"}>
                  {tierFeatures.priorityListing ? "✓" : "✗"}
                </span>
                <span>Priority Listing</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-white">
                  {tierFeatures.treatmentsLimit}
                </span>
                <span>Treatments Limit</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-white">
                  {tierFeatures.reviewDisplay}
                </span>
                <span>Review Display Level</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierEditor;