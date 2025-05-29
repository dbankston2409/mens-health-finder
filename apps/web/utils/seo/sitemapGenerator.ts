import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, Timestamp, limit, orderBy } from 'firebase/firestore';
import { Clinic } from '../../types';
import { createClinicSlug, slugify } from '../../lib/utils';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * Generates a sitemap.xml string for all active clinics
 * @returns - XML string of the sitemap
 */
export async function generateSitemap(): Promise<string> {
  try {
    // Fetch all active clinics that are publicly visible
    const clinicsRef = collection(db, 'clinics');
    
    // We'll need multiple queries since Firestore doesn't support OR conditions
    const queries = [
      // Query for clinics with tier field
      query(
        clinicsRef, 
        where('status', '==', 'active'),
        where('tier', 'in', ['premium', 'advanced', 'basic', 'free']),
        orderBy('lastUpdated', 'desc'),
        limit(1000) // Reasonable limit for sitemap size
      ),
      
      // Query for clinics with package field (for backward compatibility)
      query(
        clinicsRef,
        where('status', '==', 'active'),
        where('package', 'in', ['premium', 'advanced', 'basic', 'free']),
        orderBy('lastUpdated', 'desc'),
        limit(1000) // Reasonable limit for sitemap size
      )
    ];
    const querySnapshot = await getDocs(q);
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com';
    const currentDate = new Date().toISOString();
    
    // Start building the XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    // Add the homepage
    sitemap += `
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
    
    // Add static pages
    const staticPages = [
      'about',
      'contact',
      'search'
    ];
    
    for (const page of staticPages) {
      sitemap += `
  <url>
    <loc>${baseUrl}/${page}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
    }
    
    // Add each clinic
    const clinicUrls: string[] = [];
    const processedClinicIds = new Set<string>();
    const cities = new Map<string, string[]>(); // state -> [city1, city2, ...]
    const states = new Set<string>();
    const services = new Set<string>();
    
    // Process each query
    for (const q of queries) {
      const querySnapshot = await getDocs(q);
      console.log(`Processing ${querySnapshot.size} clinics from query...`);
      
      querySnapshot.forEach((doc) => {
        // Skip if already processed
        if (processedClinicIds.has(doc.id)) return;
        processedClinicIds.add(doc.id);
      const clinic = doc.data() as Clinic;
      clinic.id = doc.id;
      
      // Create the URL for the clinic
      const clinicSlug = createClinicSlug(clinic.name, clinic.city, clinic.state);
      const citySlug = slugify(clinic.city);
      const stateSlug = slugify(clinic.state.toLowerCase());
      
      // Direct clinic URL
      const clinicUrl = `${baseUrl}/clinic/${doc.id}`;
      
      // SEO-friendly URL structure if we have services
      if (clinic.services && clinic.services.length > 0) {
        clinic.services.forEach(service => {
          const serviceSlug = slugify(service);
          const seoUrl = `${baseUrl}/${serviceSlug}/${stateSlug}/${citySlug}/${clinicSlug}`;
          
          clinicUrls.push(seoUrl);
        });
      }
      
      // Always include the direct URL
      clinicUrls.push(clinicUrl);
      
      // Track states and cities for generating index pages
      const stateCode = clinic.state.toLowerCase();
      states.add(stateCode);
      
      if (!cities.has(stateCode)) {
        cities.set(stateCode, []);
      }
      
      const cityList = cities.get(stateCode) || [];
      if (!cityList.includes(citySlug)) {
        cityList.push(citySlug);
        cities.set(stateCode, cityList);
      }
      
      // Track services for category pages
      if (clinic.services && clinic.services.length > 0) {
        clinic.services.forEach(service => {
          services.add(slugify(service));
        });
      }
    });
    }
    
    console.log(`Processed ${processedClinicIds.size} unique clinics`);
    
    // Add unique clinic URLs to sitemap
    const uniqueUrls = [...new Set(clinicUrls)];
    
    for (const url of uniqueUrls) {
      sitemap += `
  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    }
    
    // Generate category pages
    for (const service of services) {
      // Category index
      sitemap += `
  <url>
    <loc>${baseUrl}/${service}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      
      // Add state-level pages for each category
      for (const state of states) {
        sitemap += `
  <url>
    <loc>${baseUrl}/${service}/${state}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        
        // Add city-level pages for each state and category
        const stateCities = cities.get(state) || [];
        for (const city of stateCities) {
          sitemap += `
  <url>
    <loc>${baseUrl}/${service}/${state}/${city}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        }
      }
    }
    
    // Add state pages
    for (const state of states) {
      sitemap += `
  <url>
    <loc>${baseUrl}/state/${state}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }
    
    // Add city pages
    for (const [state, stateCities] of cities.entries()) {
      for (const city of stateCities) {
        sitemap += `
  <url>
    <loc>${baseUrl}/city/${state}/${city}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }
    
    // Close the sitemap
    sitemap += `
</urlset>`;
    
    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}

/**
 * Writes the sitemap to a file
 * 
 * @param sitemap - XML string of the sitemap
 * @param filePath - Path to write the sitemap file
 * @returns - Success status
 */
export async function writeSitemapToFile(sitemap: string, filePath: string): Promise<boolean> {
  try {
    // Ensure the directory exists
    const directory = path.dirname(filePath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    
    // Write the sitemap to file
    fs.writeFileSync(filePath, sitemap);
    return true;
  } catch (error) {
    console.error('Error writing sitemap to file:', error);
    return false;
  }
}

/**
 * Pings Google Search Console with the sitemap URL
 * 
 * @param sitemapUrl - The full URL to the sitemap
 * @returns - Success status
 */
export async function pingGoogleWithSitemap(sitemapUrl: string): Promise<boolean> {
  try {
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const response = await axios.get(pingUrl);
    
    return response.status === 200;
  } catch (error) {
    console.error('Error pinging Google with sitemap:', error);
    return false;
  }
}

/**
 * Full sitemap generation process:
 * 1. Generate sitemap XML
 * 2. Write to file
 * 3. Ping Google Search Console
 * 
 * @returns - Success status
 */
export async function generateSitemapDaily(): Promise<boolean> {
  try {
    // Generate the sitemap XML
    const sitemap = await generateSitemap();
    
    // Write to public directory
    const filePath = path.join(process.cwd(), 'public', 'sitemap.xml');
    const writeSuccess = await writeSitemapToFile(sitemap, filePath);
    
    if (!writeSuccess) {
      return false;
    }
    
    // Ping Google Search Console
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com';
    const sitemapUrl = `${siteUrl}/sitemap.xml`;
    const pingSuccess = await pingGoogleWithSitemap(sitemapUrl);
    
    return pingSuccess;
  } catch (error) {
    console.error('Error in sitemap generation process:', error);
    return false;
  }
}