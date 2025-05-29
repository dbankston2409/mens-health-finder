// Script to generate sitemap.xml for Men's Health Finder
const { db } = require('../lib/firebase');
const { collection, query, where, getDocs } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Utility function to slugify text
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')       // Replace spaces with hyphens
    .replace(/&/g, '-and-')     // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')   // Remove all non-word characters
    .replace(/\-\-+/g, '-')     // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '')         // Trim hyphens from start
    .replace(/-+$/, '');        // Trim hyphens from end
}

// Create a unique clinic slug
function createClinicSlug(name, city, state) {
  return slugify(`${name}-${city}-${state}`);
}

// Main function to generate sitemap
async function generateSitemap() {
  try {
    console.log('Fetching clinics from Firestore...');
    
    // Fetch all active clinics that are not hidden
    const clinicsRef = collection(db, 'clinics');
    const q = query(
      clinicsRef, 
      where('status', '==', 'active'),
      where('tier', '!=', 'hidden')
    );
    
    // For backward compatibility, also check for 'package' field
    const packageQuery = query(
      clinicsRef,
      where('status', '==', 'active'),
      where('package', '!=', 'hidden')
    );
    const querySnapshot = await getDocs(q);
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://menshealthfinder.com';
    const currentDate = new Date().toISOString();
    
    console.log(`Building sitemap with base URL: ${baseUrl}`);
    
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
    const clinicUrls = [];
    const processedClinicIds = new Set();
    
    // Process results from first query
    console.log(`Processing ${querySnapshot.size} clinics from tier query...`);
    
    // Function to process a clinic document
    const processClinic = (doc) => {
      if (processedClinicIds.has(doc.id)) return; // Skip if already processed
      processedClinicIds.add(doc.id);
      const clinic = doc.data();
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
    };
    
    // Process clinics from the first query
    querySnapshot.forEach(processClinic);
    
    // Process clinics from the second query
    const packageSnapshot = await getDocs(packageQuery);
    console.log(`Processing ${packageSnapshot.size} clinics from package query...`);
    packageSnapshot.forEach(processClinic);
    
    console.log(`Total unique clinics processed: ${processedClinicIds.size}`);
    
    console.log(`Generated ${clinicUrls.length} clinic URLs`);
    
    // Add unique clinic URLs to sitemap
    const uniqueUrls = [...new Set(clinicUrls)];
    
    // Generate category pages
    const categories = [
      'trt', 'testosterone-replacement-therapy',
      'ed-treatment', 'erectile-dysfunction',
      'hair-loss', 
      'weight-loss',
      'peptide-therapy',
      'hormone-optimization'
    ];
    
    // Generate state-level pages
    const states = new Set();
    querySnapshot.forEach(doc => {
      const clinic = doc.data();
      states.add(slugify(clinic.state.toLowerCase()));
    });
    
    // Add category pages
    for (const category of categories) {
      // Category index
      sitemap += `
  <url>
    <loc>${baseUrl}/${category}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      
      // State pages for each category
      for (const state of states) {
        sitemap += `
  <url>
    <loc>${baseUrl}/${category}/${state}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      }
    }
    
    // Add unique location city pages
    const locationPages = new Map(); // Map city-state to count
    querySnapshot.forEach(doc => {
      const clinic = doc.data();
      const cityStateKey = `${slugify(clinic.city)}-${slugify(clinic.state)}`;
      locationPages.set(cityStateKey, (locationPages.get(cityStateKey) || 0) + 1);
    });
    
    // Only include cities with 2+ clinics
    for (const [cityState, count] of locationPages.entries()) {
      if (count >= 2) {
        const [city, state] = cityState.split('-');
        sitemap += `
  <url>
    <loc>${baseUrl}/clinics/${state}/${city}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }
    }
    
    for (const url of uniqueUrls) {
      sitemap += `
  <url>
    <loc>${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    }
    
    // Close the sitemap
    sitemap += `
</urlset>`;
    
    // Write sitemap to file
    const filePath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(filePath, sitemap);
    
    console.log(`Sitemap generated successfully: ${filePath}`);
    console.log(`Contains ${uniqueUrls.length + 1 + staticPages.length} URLs`);
    
    // Ping search engines
    await pingSearchEngines(`${baseUrl}/sitemap.xml`);
    
    return true;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return false;
  }
}

// Ping search engines with the sitemap URL
async function pingSearchEngines(sitemapUrl) {
  try {
    console.log('Pinging search engines...');
    
    // Ping Google
    const googleUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const googleResponse = await axios.get(googleUrl);
    console.log(`Google ping status: ${googleResponse.status}`);
    
    // Ping Bing
    const bingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    const bingResponse = await axios.get(bingUrl);
    console.log(`Bing ping status: ${bingResponse.status}`);
    
    console.log('Search engine pings completed');
  } catch (error) {
    console.error('Error pinging search engines:', error);
  }
}

// Run the script
generateSitemap()
  .then(() => console.log('Sitemap generation process completed'))
  .catch(err => console.error('Sitemap generation process failed:', err));