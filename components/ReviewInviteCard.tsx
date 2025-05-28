import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/solid';
import { ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';

interface ReviewInviteCardProps {
  clinicSlug: string;
  clinicName: string;
  trigger?: 'scroll' | 'time' | 'manual';
  position?: 'inline' | 'floating' | 'sidebar';
  onDismiss?: () => void;
  onReviewClick?: () => void;
}

export default function ReviewInviteCard({
  clinicSlug,
  clinicName,
  trigger = 'scroll',
  position = 'inline',
  onDismiss,
  onReviewClick
}: ReviewInviteCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasScrolledPastTrigger, setHasScrolledPastTrigger] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed this invite for this clinic
    const dismissedKey = `review-invite-dismissed-${clinicSlug}`;
    const wasDismissed = localStorage.getItem(dismissedKey);
    
    if (wasDismissed) {
      setIsDismissed(true);
      return;
    }

    // Handle different trigger types
    switch (trigger) {
      case 'scroll':
        setupScrollTrigger();
        break;
      case 'time':
        setupTimeTrigger();
        break;
      case 'manual':
        setIsVisible(true);
        break;
    }

    return () => {
      if (trigger === 'scroll') {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [trigger, clinicSlug]);

  const setupScrollTrigger = () => {
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      
      // Show after 60% scroll or 45 seconds of dwell time
      if (scrollPercent > 60 && !hasScrolledPastTrigger) {
        setHasScrolledPastTrigger(true);
        setTimeout(() => setIsVisible(true), 1000); // Small delay for better UX
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  };

  const setupTimeTrigger = () => {
    // Show after 45 seconds of page time
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 45000);

    return () => clearTimeout(timer);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    
    // Remember dismissal for this clinic
    const dismissedKey = `review-invite-dismissed-${clinicSlug}`;
    localStorage.setItem(dismissedKey, Date.now().toString());
    
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleReviewClick = () => {
    // Track analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'review_invite_click', {
        clinic_slug: clinicSlug,
        trigger_type: trigger,
        position: position
      });
    }
    
    if (onReviewClick) {
      onReviewClick();
    }
  };

  if (isDismissed || !isVisible) {
    return null;
  }

  const getPositionStyles = () => {
    switch (position) {
      case 'floating':
        return 'fixed bottom-4 right-4 z-50 max-w-sm shadow-lg';
      case 'sidebar':
        return 'sticky top-4';
      default:
        return 'mx-auto max-w-md';
    }
  };

  const getCardStyles = () => {
    const baseStyles = 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4';
    
    if (position === 'floating') {
      return `${baseStyles} shadow-xl border-blue-300`;
    }
    
    return baseStyles;
  };

  return (
    <div className={getPositionStyles()}>
      <div className={getCardStyles()}>
        {/* Dismiss button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
        
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="bg-blue-100 rounded-full p-2">
              <ChatBubbleLeftEllipsisIcon className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              Visited this clinic?
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              Help others by sharing your experience with {clinicName}.
            </p>
            
            {/* Star rating preview */}
            <div className="flex items-center space-x-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className="h-4 w-4 text-yellow-400"
                />
              ))}
              <span className="text-xs text-gray-500 ml-1">Rate your experience</span>
            </div>
            
            <div className="flex space-x-2">
              <Link href={`/review/create/${clinicSlug}`}>
                <button
                  onClick={handleReviewClick}
                  className="bg-blue-600 text-white text-sm font-medium px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Leave Review
                </button>
              </Link>
              
              <button
                onClick={handleDismiss}
                className="text-gray-500 text-sm font-medium px-3 py-1.5 rounded-md hover:text-gray-700 transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
        
        {/* Trust indicators */}
        <div className="mt-3 pt-3 border-t border-blue-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>✓ Anonymous option available</span>
            <span>✓ Takes 2 minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for programmatic control
export function useReviewInvite(clinicSlug: string) {
  const [shouldShow, setShouldShow] = useState(false);
  
  const showInvite = () => setShouldShow(true);
  const hideInvite = () => setShouldShow(false);
  
  const checkShouldShow = () => {
    const dismissedKey = `review-invite-dismissed-${clinicSlug}`;
    const lastDismissed = localStorage.getItem(dismissedKey);
    
    if (!lastDismissed) return true;
    
    // Show again after 30 days
    const dismissedTime = parseInt(lastDismissed);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    return dismissedTime < thirtyDaysAgo;
  };
  
  return {
    shouldShow,
    showInvite,
    hideInvite,
    checkShouldShow
  };
}