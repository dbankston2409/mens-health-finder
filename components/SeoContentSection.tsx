import React from 'react';
import { useSeoMeta } from '../apps/web/utils/hooks/useSeoMeta';

interface SeoContentSectionProps {
  clinicSlug: string;
  className?: string;
}

export function SeoContentSection({ clinicSlug, className = '' }: SeoContentSectionProps) {
  const { seoMeta, loading, error } = useSeoMeta(clinicSlug);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !seoMeta) {
    return null; // Fail silently for better UX
  }

  return (
    <section className={`seo-content-section ${className}`}>
      {seoMeta.content && (
        <div 
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: seoMeta.content }}
        />
      )}
    </section>
  );
}

interface SeoSchemaMarkupProps {
  clinicSlug: string;
}

export function SeoSchemaMarkup({ clinicSlug }: SeoSchemaMarkupProps) {
  const { seoMeta, loading, error } = useSeoMeta(clinicSlug);

  if (loading || error || !seoMeta?.schemaMarkup) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: seoMeta.schemaMarkup }}
    />
  );
}

interface SeoMetaTagsProps {
  clinicSlug: string;
}

export function SeoMetaTags({ clinicSlug }: SeoMetaTagsProps) {
  const { seoMeta, loading, error } = useSeoMeta(clinicSlug);

  if (loading || error || !seoMeta) {
    return null;
  }

  return (
    <>
      {seoMeta.title && (
        <>
          <title>{seoMeta.title}</title>
          <meta property="og:title" content={seoMeta.title} />
          <meta name="twitter:title" content={seoMeta.title} />
        </>
      )}
      {seoMeta.description && (
        <>
          <meta name="description" content={seoMeta.description} />
          <meta property="og:description" content={seoMeta.description} />
          <meta name="twitter:description" content={seoMeta.description} />
        </>
      )}
      {seoMeta.keywords && seoMeta.keywords.length > 0 && (
        <meta name="keywords" content={seoMeta.keywords.join(', ')} />
      )}
    </>
  );
}