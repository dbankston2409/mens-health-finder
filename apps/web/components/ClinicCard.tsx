import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TierBadge from './TierBadge';

interface Clinic {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  services: string[];
  tier: 'free' | 'low' | 'high';
  phone?: string;
  website?: string;
  rating?: number;
  reviewCount?: number;
  distance?: number;
  logo?: string;
  verified?: boolean;
}

interface ClinicCardProps {
  clinic: Clinic;
  showDistance?: boolean;
  compact?: boolean;
  onClick?: (clinic: Clinic) => void;
}

const ClinicCard: React.FC<ClinicCardProps> = ({
  clinic,
  showDistance = false,
  compact = false,
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(clinic);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent card click when clicking on buttons or links
    if ((e.target as HTMLElement).closest('button, a')) {
      return;
    }
    handleClick();
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) {
      return `${(distance * 5280).toFixed(0)} ft`;
    }
    return `${distance.toFixed(1)} mi`;
  };

  const getCallTrackingNumber = () => {
    // In production, this would generate a unique tracking number per session
    return clinic.phone;
  };

  const handleCallClick = () => {
    // Track call interaction
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'call_click', {
        event_category: 'engagement',
        event_label: clinic.name,
        clinic_id: clinic.id
      });
    }
  };

  const handleWebsiteClick = () => {
    // Track website click
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'website_click', {
        event_category: 'engagement',
        event_label: clinic.name,
        clinic_id: clinic.id
      });
    }
  };

  if (compact) {
    return (
      <div 
        onClick={handleCardClick}
        className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-all cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
            {clinic.logo ? (
              <Image
                src={clinic.logo}
                alt={`${clinic.name} logo`}
                width={32}
                height={32}
                className="rounded-md"
              />
            ) : (
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white group-hover:text-primary transition-colors truncate">
                {clinic.name}
              </h3>
              <TierBadge tier={clinic.tier} size="sm" />
              {clinic.verified && (
                <svg className="w-4 h-4 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-gray-400 text-sm truncate">
              {clinic.city}, {clinic.state}
              {showDistance && clinic.distance && (
                <span className="ml-2 text-primary">• {formatDistance(clinic.distance)}</span>
              )}
            </p>
          </div>

          {/* Call Button */}
          {clinic.phone && (
            <a
              href={`tel:${getCallTrackingNumber()}`}
              onClick={handleCallClick}
              className="p-2 bg-primary hover:bg-red-600 text-white rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 hover:shadow-lg transition-all duration-200 cursor-pointer group"
    >
      {/* Header with logo and tier */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div className="w-16 h-16 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
              {clinic.logo ? (
                <Image
                  src={clinic.logo}
                  alt={`${clinic.name} logo`}
                  width={48}
                  height={48}
                  className="rounded-lg"
                />
              ) : (
                <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
                </svg>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors truncate">
                  {clinic.name}
                </h3>
                {clinic.verified && (
                  <svg className="w-5 h-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-gray-400 mb-2">
                {clinic.address}
              </p>
              <p className="text-gray-400">
                {clinic.city}, {clinic.state}
                {showDistance && clinic.distance && (
                  <span className="ml-2 text-primary font-medium">• {formatDistance(clinic.distance)}</span>
                )}
              </p>
            </div>
          </div>

          {/* Tier Badge */}
          <TierBadge tier={clinic.tier} />
        </div>

        {/* Rating */}
        {clinic.rating && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex text-yellow-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className="w-4 h-4"
                  fill={star <= Math.floor(clinic.rating!) ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              ))}
            </div>
            <span className="text-gray-400 text-sm">
              {clinic.rating} {clinic.reviewCount && `(${clinic.reviewCount} reviews)`}
            </span>
          </div>
        )}

        {/* Services */}
        <div className="flex flex-wrap gap-2 mb-6">
          {clinic.services.slice(0, 4).map((service) => (
            <span
              key={service}
              className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full"
            >
              {service}
            </span>
          ))}
          {clinic.services.length > 4 && (
            <span className="px-3 py-1 bg-gray-700 text-gray-400 text-sm rounded-full">
              +{clinic.services.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6">
        <div className="flex gap-3">
          <Link
            href={`/clinic/${clinic.id}`}
            className="flex-1 px-4 py-2 bg-primary hover:bg-red-600 text-white text-center font-medium rounded-lg transition-colors"
          >
            View Profile
          </Link>
          
          {clinic.phone && (
            <a
              href={`tel:${getCallTrackingNumber()}`}
              onClick={handleCallClick}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span className="hidden sm:inline">Call</span>
            </a>
          )}

          {clinic.website && (
            <a
              href={clinic.website}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWebsiteClick}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white border border-gray-700 hover:border-gray-600 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="hidden sm:inline">Website</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClinicCard;