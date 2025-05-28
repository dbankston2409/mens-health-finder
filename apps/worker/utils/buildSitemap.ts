import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import * as fs from 'fs';
import * as path from 'path';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

interface SitemapResult {
  success: boolean;
  urlCount: number;
  filePath: string;
  error?: string;
}

export async function buildSitemap(isDev = false): Promise<SitemapResult> {
  try {
    console.log('🗺️ Starting sitemap generation...');
    
    // Get all active clinics
    const clinicsRef = collection(db, 'clinics');
    const activeQuery = query(clinicsRef, where('status', '==', 'active'));
    const snapshot = await getDocs(activeQuery);
    
    const urls: SitemapUrl[] = [];
    const baseUrl = isDev 
      ? 'http://localhost:3000' 
      : 'https://menshealthfinder.com';
    
    // Add static pages first
    urls.push(
      {
        loc: baseUrl,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'daily',
        priority: 1.0
      },
      {
        loc: `${baseUrl}/about`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.8
      },
      {
        loc: `${baseUrl}/contact`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: 0.6
      }
    );
    
    // Process clinic pages
    snapshot.docs.forEach(doc => {
      const clinic = doc.data();
      
      if (clinic.slug && clinic.category && clinic.state && clinic.city) {
        const lastmod = clinic.updatedAt 
          ? clinic.updatedAt.toDate().toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        
        urls.push({
          loc: `${baseUrl}/${clinic.category}/${clinic.state}/${clinic.city}/${clinic.slug}`,
          lastmod,
          changefreq: 'weekly',
          priority: 0.9
        });
      }
    });
    
    // Generate XML sitemap
    const xml = generateSitemapXml(urls);
    
    // Determine output path
    const outputPath = isDev
      ? path.join(process.cwd(), '../../apps/web/public/sitemap.xml')
      : path.join(process.cwd(), '../web/public/sitemap.xml');
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write sitemap file
    fs.writeFileSync(outputPath, xml, 'utf8');
    
    console.log(`✅ Sitemap generated with ${urls.length} URLs`);
    console.log(`📁 Saved to: ${outputPath}`);
    
    return {
      success: true,
      urlCount: urls.length,
      filePath: outputPath
    };
    
  } catch (error) {
    console.error('❌ Sitemap generation failed:', error);
    return {
      success: false,
      urlCount: 0,
      filePath: '',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function generateSitemapXml(urls: SitemapUrl[]): string {
  const urlElements = urls.map(url => {
    let urlXml = `    <url>\n      <loc>${escapeXml(url.loc)}</loc>\n      <lastmod>${url.lastmod}</lastmod>`;
    
    if (url.changefreq) {
      urlXml += `\n      <changefreq>${url.changefreq}</changefreq>`;
    }
    
    if (url.priority !== undefined) {
      urlXml += `\n      <priority>${url.priority.toFixed(1)}</priority>`;
    }
    
    urlXml += '\n    </url>';
    return urlXml;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

export async function getSitemapStats(): Promise<{
  totalUrls: number;
  staticPages: number;
  clinicPages: number;
  lastGenerated?: Date;
}> {
  try {
    const clinicsRef = collection(db, 'clinics');
    const activeQuery = query(clinicsRef, where('status', '==', 'active'));
    const snapshot = await getDocs(activeQuery);
    
    const clinicPages = snapshot.docs.filter(doc => {
      const clinic = doc.data();
      return clinic.slug && clinic.category && clinic.state && clinic.city;
    }).length;
    
    const staticPages = 3; // home, about, contact
    
    return {
      totalUrls: staticPages + clinicPages,
      staticPages,
      clinicPages,
      lastGenerated: new Date()
    };
  } catch (error) {
    console.error('Error getting sitemap stats:', error);
    return {
      totalUrls: 0,
      staticPages: 0,
      clinicPages: 0
    };
  }
}