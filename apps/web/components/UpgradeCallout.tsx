import React from 'react';
import Link from 'next/link';
import { Clinic } from '../types';
import { getTierDisplayName, getNextUpgradeTier } from '../utils/tierUtils';

interface UpgradeCalloutProps {
  clinic: Clinic;
  currentUserIsOwner?: boolean;
}

const UpgradeCallout: React.FC<UpgradeCalloutProps> = ({ clinic, currentUserIsOwner = false }) => {
  // Determine the current tier and next tier
  const currentTier = clinic.tier || 'free';
  const nextTier = getNextUpgradeTier(clinic);
  
  // Don't show for advanced tier
  if (currentTier === 'advanced') {
    return null;
  }
  
  // Different messaging based on whether the user owns the clinic
  const isClaimView = !currentUserIsOwner;
  const clinicName = clinic.name;
  
  if (isClaimView) {
    // Claim view for non-owners
    return (
      <div className="p-6 bg-gradient-to-r from-blue-900/50 to-blue-700/50 rounded-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">Claim Your Full Profile</h3>
            <p className="text-textSecondary max-w-xl">
              Is this your clinic? Claim your {clinicName} profile to verify your listing, add your logo, 
              customize your page, and get premium placement in search results.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link 
              href="/claim-profile" 
              className="btn inline-block text-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-6 py-3 rounded-lg shadow-md"
            >
              Claim This Profile
            </Link>
          </div>
        </div>
      </div>
    );
  } else {
    // Upgrade view for clinic owners
    return (
      <div className="p-6 bg-gradient-to-r from-blue-900/50 to-blue-700/50 rounded-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold mb-1">
              Upgrade to {getTierDisplayName(nextTier!)}
            </h3>
            <p className="text-textSecondary max-w-xl">
              {currentTier === 'free' ? (
                <>
                  Your clinic is currently on our <strong>Free</strong> tier. Upgrade to <strong>Standard</strong> to 
                  verify your listing, add your logo, and get enhanced placement in search results.
                </>
              ) : (
                <>
                  Your clinic is currently on our <strong>Standard</strong> tier. Upgrade to <strong>Advanced</strong> to 
                  get premium placement in search results, custom analytics, and advanced features.
                </>
              )}
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link 
              href="/dashboard/billing" 
              className="btn inline-block text-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-6 py-3 rounded-lg shadow-md"
            >
              Upgrade Now
            </Link>
          </div>
        </div>
      </div>
    );
  }
};

export default UpgradeCallout;