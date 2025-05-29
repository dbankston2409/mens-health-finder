import React from 'react';
import Link from 'next/link';
import TierBadge from './TierBadge';

interface Clinic {
  id: number;
  name: string;
  city: string;
  state: string;
  tier: 'free' | 'standard' | 'advanced' | 'low' | 'high'; // Support both new and legacy tier values
  services?: string[];
  rating?: number;
  reviewCount?: number;
}

interface RecommendedProvidersProps {
  currentClinicId: number;
  currentCity: string;
  currentState: string;
  clinics: Clinic[];
}

const RecommendedProviders: React.FC<RecommendedProvidersProps> = ({
  currentClinicId,
  currentCity,
  currentState,
  clinics
}) => {
  // Filter to show only paid providers (standard/low or advanced/high tier) in the same city/state
  // Exclude the current clinic and limit to 2
  const recommendations = clinics
    .filter(clinic => 
      clinic.id !== currentClinicId && 
      (clinic.tier === 'standard' || clinic.tier === 'advanced' || 
       clinic.tier === 'low' || clinic.tier === 'high') &&
      clinic.city === currentCity &&
      clinic.state === currentState
    )
    .slice(0, 2);
  
  if (recommendations.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-8 p-6 bg-gray-900 rounded-xl">
      <h3 className="text-xl font-bold mb-4">Recommended Providers Near You</h3>
      <p className="text-textSecondary mb-6">
        These verified providers in {currentCity} specialize in men's health services.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recommendations.map((clinic) => (
          <div key={clinic.id} className="p-4 bg-[#111111] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-lg font-bold">{clinic.name}</h4>
              <TierBadge tier={clinic.tier} size="sm" />
            </div>
            
            <p className="text-sm text-textSecondary mb-2">{clinic.city}, {clinic.state}</p>
            
            {clinic.rating && (
              <div className="flex items-center mb-2">
                <div className="flex text-yellow-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4" fill={star <= Math.floor(clinic.rating || 0) ? 'currentColor' : 'none'} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-[#AAAAAA] text-xs">{clinic.rating} ({clinic.reviewCount} reviews)</span>
              </div>
            )}
            
            {clinic.services && clinic.services.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {clinic.services.slice(0, 3).map((service) => (
                  <span key={service} className="text-xs px-2 py-0.5 bg-gray-800 rounded-full">
                    {service}
                  </span>
                ))}
                {clinic.services.length > 3 && (
                  <span className="text-xs px-2 py-0.5 bg-gray-800 rounded-full">
                    +{clinic.services.length - 3}
                  </span>
                )}
              </div>
            )}
            
            <Link 
              href={`/clinic/${clinic.id}`}
              className="inline-block text-sm text-primary hover:underline"
            >
              View Profile →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedProviders;