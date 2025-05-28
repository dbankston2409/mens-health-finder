import React from 'react';

interface SeoContentSectionProps {
  content: string;
  className?: string;
}

/**
 * Renders the SEO content section on a clinic profile page
 */
const SeoContentSection: React.FC<SeoContentSectionProps> = ({ content, className = '' }) => {
  // If no content is provided, don't render anything
  if (!content) {
    return null;
  }
  
  return (
    <section className={`mt-8 ${className}`}>
      <div 
        className="seo-content-wrapper"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
};

export default SeoContentSection;