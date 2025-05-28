// Export all SEO utilities from a single file

// Metadata generator
export { 
  generateSeoMeta,
  storeSeoMeta,
  updateIndexStatus,
  generateAndStoreSeoMeta,
  batchGenerateSeoMeta
} from './metadataGenerator';

// Content generator
export {
  generateSeoContent,
  storeSeoContent,
  generateAndStoreSeoContent,
  batchGenerateSeoContent
} from './contentGenerator';

// Sitemap generator
export {
  generateSitemap,
  writeSitemapToFile,
  pingGoogleWithSitemap,
  generateSitemapDaily
} from './sitemapGenerator';

/**
 * Hook for retrieving and analyzing SEO performance data
 * To be implemented for the admin dashboard
 */
export const useSeoPerformance = () => {
  // This would be implemented in a real application
  return {
    loading: false,
    error: null,
    metrics: {
      indexedPercentage: 0,
      topSearchTerms: [],
      totalViews: 0
    },
    refreshData: () => {},
    exportCsv: () => {}
  };
};