import React, { useEffect, useState } from 'react';
import { variantSplitManager } from '../utils/analytics/runVariantSplitLogic';
import { trackCTAClick } from '../utils/analytics/trackConversion';

interface VariantBannerProps {
  clinicSlug: string;
  testType: 'cta' | 'seoHeader' | 'description' | 'layout' | 'pricing' | 'testimonial';
  defaultContent: string;
  className?: string;
  onClick?: () => void;
  elementId?: string;
  pageSlug: string;
}

export const VariantBanner: React.FC<VariantBannerProps> = ({
  clinicSlug,
  testType,
  defaultContent,
  className = '',
  onClick,
  elementId,
  pageSlug
}) => {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [testId, setTestId] = useState<string | null>(null);

  useEffect(() => {
    loadVariantContent();
  }, [clinicSlug, testType, defaultContent]);

  const loadVariantContent = async () => {
    try {
      const userId = variantSplitManager.getUserId();
      const assignments = await variantSplitManager.getVariantForUser({
        userId,
        clinicSlug,
        testType
      });
      
      const assignment = assignments.find(a => a.testType === testType);
      if (assignment) {
        setContent(assignment.content);
        setVariantId(assignment.variantId);
        setTestId(assignment.testId);
        
        // Track the view
        await variantSplitManager.trackVariantView(
          assignment.testId,
          assignment.variantId,
          userId
        );
      } else {
        setContent(defaultContent);
      }
    } catch (error) {
      console.error('Error loading variant content:', error);
      setContent(defaultContent);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async () => {
    // Track the click conversion if this is a CTA
    if (testType === 'cta' && content) {
      try {
        await trackCTAClick({
          clinicSlug,
          ctaText: content,
          pageSlug,
          elementId: elementId || 'variant-banner',
          variantId: variantId || undefined
        });
      } catch (error) {
        console.error('Error tracking CTA click:', error);
      }
    }
    
    // Call the original onClick handler
    if (onClick) {
      onClick();
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 rounded ${className}`}>
        <div className="h-6 bg-gray-300 rounded"></div>
      </div>
    );
  }

  // Render different content types appropriately
  switch (testType) {
    case 'cta':
      return (
        <button
          onClick={handleClick}
          className={`variant-cta ${className}`}
          data-variant-id={variantId}
          data-test-id={testId}
        >
          {content}
        </button>
      );
      
    case 'seoHeader':
      return (
        <h1
          className={`variant-header ${className}`}
          data-variant-id={variantId}
          data-test-id={testId}
        >
          {content}
        </h1>
      );
      
    case 'description':
      return (
        <p
          className={`variant-description ${className}`}
          data-variant-id={variantId}
          data-test-id={testId}
        >
          {content}
        </p>
      );
      
    case 'testimonial':
      return (
        <blockquote
          className={`variant-testimonial ${className}`}
          data-variant-id={variantId}
          data-test-id={testId}
        >
          {content}
        </blockquote>
      );
      
    case 'pricing':
      return (
        <div
          className={`variant-pricing ${className}`}
          data-variant-id={variantId}
          data-test-id={testId}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
      
    case 'layout':
      return (
        <div
          className={`variant-layout ${className}`}
          data-variant-id={variantId}
          data-test-id={testId}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      );
      
    default:
      return (
        <div
          className={`variant-content ${className}`}
          data-variant-id={variantId}
          data-test-id={testId}
          onClick={handleClick}
        >
          {content}
        </div>
      );
  }
};

// Specialized components for common use cases
export const VariantCTAButton: React.FC<{
  clinicSlug: string;
  defaultText: string;
  pageSlug: string;
  className?: string;
  onClick?: () => void;
}> = ({ clinicSlug, defaultText, pageSlug, className, onClick }) => {
  return (
    <VariantBanner
      clinicSlug={clinicSlug}
      testType="cta"
      defaultContent={defaultText}
      pageSlug={pageSlug}
      className={className || "bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"}
      onClick={onClick}
      elementId="cta-button"
    />
  );
};

export const VariantHeader: React.FC<{
  clinicSlug: string;
  defaultText: string;
  pageSlug: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}> = ({ clinicSlug, defaultText, pageSlug, level = 1, className }) => {
  const baseClassName = level === 1 ? "text-4xl font-bold" :
                       level === 2 ? "text-3xl font-bold" :
                       level === 3 ? "text-2xl font-bold" :
                       level === 4 ? "text-xl font-bold" :
                       level === 5 ? "text-lg font-bold" :
                       "text-base font-bold";
  
  return (
    <VariantBanner
      clinicSlug={clinicSlug}
      testType="seoHeader"
      defaultContent={defaultText}
      pageSlug={pageSlug}
      className={`${baseClassName} ${className || "text-gray-900"}`}
      elementId={`header-h${level}`}
    />
  );
};

export const VariantDescription: React.FC<{
  clinicSlug: string;
  defaultText: string;
  pageSlug: string;
  className?: string;
}> = ({ clinicSlug, defaultText, pageSlug, className }) => {
  return (
    <VariantBanner
      clinicSlug={clinicSlug}
      testType="description"
      defaultContent={defaultText}
      pageSlug={pageSlug}
      className={className || "text-gray-600 leading-relaxed"}
      elementId="description"
    />
  );
};

export const VariantTestimonial: React.FC<{
  clinicSlug: string;
  defaultText: string;
  pageSlug: string;
  className?: string;
}> = ({ clinicSlug, defaultText, pageSlug, className }) => {
  return (
    <VariantBanner
      clinicSlug={clinicSlug}
      testType="testimonial"
      defaultContent={defaultText}
      pageSlug={pageSlug}
      className={className || "italic text-gray-700 border-l-4 border-blue-500 pl-4"}
      elementId="testimonial"
    />
  );
};

// Hook for getting variant content without rendering
export const useVariantContent = ({
  clinicSlug,
  testType,
  defaultContent
}: {
  clinicSlug: string;
  testType: VariantBannerProps['testType'];
  defaultContent: string;
}) => {
  const [content, setContent] = useState(defaultContent);
  const [loading, setLoading] = useState(true);
  const [variantId, setVariantId] = useState<string | null>(null);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const userId = variantSplitManager.getUserId();
        const variantContent = await variantSplitManager.getVariantContent({
          userId,
          clinicSlug,
          testType,
          defaultContent
        });
        setContent(variantContent);
      } catch (error) {
        console.error('Error loading variant content:', error);
        setContent(defaultContent);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [clinicSlug, testType, defaultContent]);

  return { content, loading, variantId };
};