import React from 'react';
import Link from 'next/link';

interface UpgradeCalloutProps {
  clinicName: string;
}

const UpgradeCallout: React.FC<UpgradeCalloutProps> = ({ clinicName }) => {
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
};

export default UpgradeCallout;