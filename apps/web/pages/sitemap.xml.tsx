import { GetServerSideProps } from 'next';
import { generateSitemap } from '../utils/seo/sitemapGenerator';

export default function Sitemap() {
  // This component will never be rendered
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    const sitemap = await generateSitemap();
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate');
    res.write(sitemap);
    res.end();
    
    return { props: {} };
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.statusCode = 500;
    res.end();
    return { props: {} };
  }
};