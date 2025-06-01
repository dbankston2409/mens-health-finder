import React, { useState } from 'react';
import { Clinic } from '../../../types';
import FirestoreClient from '../../../lib/firestoreClient';

interface TierEditorPanelProps {
  clinic: Clinic;
  onUpdate: () => void;
}

interface TierInfo {
  name: string;
  features: string[];
  description: string;
  color: string;
  descriptionLimit: number;
  servicesLimit: number;
  price: string;
}

const TierEditorPanel: React.FC<TierEditorPanelProps> = ({ clinic, onUpdate }) => {
  const [selectedTier, setSelectedTier] = useState<'free' | 'standard' | 'advanced'>(clinic.tier);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Get the standardized tier value from potentially legacy fields
  const getCurrentTier = (): 'free' | 'standard' | 'advanced' => {
    // If we have the standardized tier field, use it
    if (clinic.tier) {
      return clinic.tier;
    }
    
    // Otherwise, convert from legacy fields
    const packageTier = clinic.package?.toLowerCase() || clinic.packageTier?.toLowerCase() || 'free';
    
    if (['premium', 'high', 'advanced'].includes(packageTier)) {
      return 'advanced';
    } else if (['basic', 'standard', 'low', 'mid', 'medium'].includes(packageTier)) {
      return 'standard';
    }
    
    return 'free';
  };
  
  // Tier information
  const tierInfo: Record<'free' | 'standard' | 'advanced', TierInfo> = {
    advanced: {
      name: 'Advanced',
      description: 'Premium visibility with all features and top placement in search results.',
      features: [
        'Premium listing in search results',
        'Priority in map view and lists',
        'Verified badge',
        'Full clinic profile with photos',
        'SEO-optimized description (up to 2000 chars)',
        'Display up to 20 services',
        'Premium review display',
        'Enhanced contact UI',
        'Custom call tracking',
        'Performance dashboard',
        'Traffic analytics'
      ],
      color: 'bg-gradient-to-r from-yellow-600 to-yellow-400',
      descriptionLimit: 2000,
      servicesLimit: 20,
      price: '$299/mo'
    },
    standard: {
      name: 'Standard',
      description: 'Enhanced visibility with more features and better placement in search results.',
      features: [
        'Enhanced listing in search results',
        'Verified badge',
        'Full clinic profile',
        'SEO-optimized description (up to 1000 chars)',
        'Display up to 10 services',
        'Enhanced review display',
        'Basic performance snapshot'
      ],
      color: 'bg-green-600',
      descriptionLimit: 1000,
      servicesLimit: 10,
      price: '$149/mo'
    },
    free: {
      name: 'Free',
      description: 'Basic listing with limited features.',
      features: [
        'Basic listing in search results',
        'Basic profile information',
        'Display up to 3 services',
        'Basic review display',
        'Limited visibility in search'
      ],
      color: 'bg-gray-600',
      descriptionLimit: 500,
      servicesLimit: 3,
      price: 'Free'
    }
  };
  
  // Handle tier change
  const handleSaveTier = async () => {
    if (selectedTier === getCurrentTier()) {
      setError('Clinic is already on this tier.');
      return;
    }
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Update tier in Firestore
      const success = await FirestoreClient.updateClinicTier(clinic.id!, selectedTier);
      
      if (success) {
        setSuccess(`Clinic tier updated to ${tierInfo[selectedTier].name}`);
        onUpdate();
      } else {
        setError('Failed to update clinic tier. Please try again.');
      }
    } catch (err) {
      console.error('Error updating tier:', err);
      setError('An error occurred while updating the tier.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-bold mb-4">Tier Management</h2>
      
      {/* Current Tier */}
      <div className="mb-6">
        <h3 className="text-sm text-gray-400 mb-2">Current Tier</h3>
        <div className="flex items-center">
          <span className={`inline-block px-3 py-1 rounded-full text-white text-sm font-medium ${tierInfo[getCurrentTier()].color}`}>
            {tierInfo[getCurrentTier()].name}
          </span>
          <span className="ml-3 text-gray-400">{tierInfo[getCurrentTier()].price}</span>
        </div>
      </div>
      
      {/* Tier Selection */}
      <div className="mb-6">
        <h3 className="text-sm text-gray-400 mb-2">Change Tier</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['free', 'standard', 'advanced'] as const).map((tier) => (
            <div
              key={tier}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                selectedTier === tier 
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedTier(tier)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`inline-block px-2 py-1 rounded-full text-white text-xs ${tierInfo[tier].color}`}>
                  {tierInfo[tier].name}
                </span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedTier === tier ? 'border-primary' : 'border-gray-600'
                }`}>
                  {selectedTier === tier && (
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-3">{tierInfo[tier].description}</p>
              <div className="text-right text-sm font-medium">{tierInfo[tier].price}</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Feature Comparison */}
      <div className="mb-6">
        <h3 className="text-sm text-gray-400 mb-2">Features</h3>
        <div className="border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800">
                <th className="py-2 px-4 text-left">Feature</th>
                <th className="py-2 px-4 text-center">Free</th>
                <th className="py-2 px-4 text-center">Standard</th>
                <th className="py-2 px-4 text-center">Advanced</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-800">
                <td className="py-2 px-4">SEO Description Limit</td>
                <td className="py-2 px-4 text-center">{tierInfo.free.descriptionLimit} chars</td>
                <td className="py-2 px-4 text-center">{tierInfo.standard.descriptionLimit} chars</td>
                <td className="py-2 px-4 text-center">{tierInfo.advanced.descriptionLimit} chars</td>
              </tr>
              <tr className="border-t border-gray-800">
                <td className="py-2 px-4">Services Limit</td>
                <td className="py-2 px-4 text-center">Up to {tierInfo.free.servicesLimit}</td>
                <td className="py-2 px-4 text-center">Up to {tierInfo.standard.servicesLimit}</td>
                <td className="py-2 px-4 text-center">Up to {tierInfo.advanced.servicesLimit}</td>
              </tr>
              <tr className="border-t border-gray-800">
                <td className="py-2 px-4">Verified Badge</td>
                <td className="py-2 px-4 text-center">❌</td>
                <td className="py-2 px-4 text-center">✅</td>
                <td className="py-2 px-4 text-center">✅</td>
              </tr>
              <tr className="border-t border-gray-800">
                <td className="py-2 px-4">Search Priority</td>
                <td className="py-2 px-4 text-center">Low</td>
                <td className="py-2 px-4 text-center">Medium</td>
                <td className="py-2 px-4 text-center">High</td>
              </tr>
              <tr className="border-t border-gray-800">
                <td className="py-2 px-4">Analytics</td>
                <td className="py-2 px-4 text-center">Basic</td>
                <td className="py-2 px-4 text-center">Enhanced</td>
                <td className="py-2 px-4 text-center">Premium</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          {success && (
            <p className="text-green-500 text-sm">{success}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedTier(getCurrentTier())}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveTier}
            disabled={saving || selectedTier === getCurrentTier()}
            className="px-4 py-2 bg-primary hover:bg-red-600 disabled:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-t-2 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              'Save Tier'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TierEditorPanel;