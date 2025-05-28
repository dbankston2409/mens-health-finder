import React from 'react';
import { logCallClick } from '../utils/callTracking';
import { PhoneIcon } from '@heroicons/react/24/solid';

interface TrackedPhoneLinkProps {
  phone: string;
  clinicId: string;
  searchQuery?: string;
  sourcePage?: string;
  buttonStyle?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const TrackedPhoneLink: React.FC<TrackedPhoneLinkProps> = ({
  phone,
  clinicId,
  searchQuery,
  sourcePage,
  buttonStyle = false,
  className = '',
  children
}) => {
  // Format phone number for display
  const formatPhoneForDisplay = (phone: string): string => {
    // Remove any non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Check for US phone number format (10 digits)
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    // Return original if we can't format it
    return phone;
  };
  
  // Format phone number for tel: link
  const formatPhoneForLink = (phone: string): string => {
    return phone.replace(/\D/g, '');
  };
  
  // Handle click event
  const handleClick = (e: React.MouseEvent) => {
    // Log the call click
    logCallClick(clinicId, searchQuery, sourcePage);
    
    // Track event in analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'phone_click', {
        clinic_id: clinicId,
        search_query: searchQuery || 'direct'
      });
    }
  };
  
  // Formatted phone numbers
  const displayPhone = formatPhoneForDisplay(phone);
  const linkPhone = formatPhoneForLink(phone);
  
  if (buttonStyle) {
    return (
      <a 
        href={`tel:${linkPhone}`}
        onClick={handleClick}
        className={`inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg transition-colors ${className}`}
      >
        <PhoneIcon className="h-4 w-4 mr-2" />
        {children || 'Call Now'}
      </a>
    );
  }
  
  return (
    <a 
      href={`tel:${linkPhone}`}
      onClick={handleClick}
      className={`inline-flex items-center text-primary hover:text-primary-dark ${className}`}
    >
      {children || (
        <>
          <PhoneIcon className="h-4 w-4 mr-1" />
          {displayPhone}
        </>
      )}
    </a>
  );
};

export default TrackedPhoneLink;