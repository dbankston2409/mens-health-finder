#!/usr/bin/env node

/**
 * Script to update existing clinics with searchableTerms for optimized search
 * This enables fast searches for treatments like "BPC-157"
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error loading service account key:', error);
  console.log('Make sure serviceAccountKey.json exists in the project root');
  process.exit(1);
}

const db = admin.firestore();

/**
 * Create searchable terms from clinic data
 */
function createSearchableTerms(clinic) {
  const terms = new Set();
  
  // Add clinic name parts
  if (clinic.name) {
    const nameParts = clinic.name.toLowerCase().split(/\s+/);
    nameParts.forEach(part => {
      if (part.length > 2) terms.add(part);
    });
    // Add full name
    terms.add(clinic.name.toLowerCase());
  }
  
  // Add services
  if (clinic.services && Array.isArray(clinic.services)) {
    clinic.services.forEach(service => {
      const serviceLower = service.toLowerCase();
      terms.add(serviceLower);
      
      // Add individual words from services
      serviceLower.split(/\s+/).forEach(word => {
        if (word.length > 2) terms.add(word);
      });
    });
  }
  
  // Add treatments if they exist
  if (clinic.treatments && Array.isArray(clinic.treatments)) {
    clinic.treatments.forEach(treatment => {
      if (treatment.term) {
        const normalized = treatment.term.toLowerCase();
        terms.add(normalized);
        
        // Add variant without hyphens
        if (normalized.includes('-')) {
          terms.add(normalized.replace(/-/g, ''));
        }
        
        // Add variant with spaces
        if (normalized.includes('-')) {
          terms.add(normalized.replace(/-/g, ' '));
        }
      }
    });
  }
  
  // Add common treatment variations from SEO content
  if (clinic.seo?.description) {
    const description = clinic.seo.description.toLowerCase();
    
    // Extract potential treatments using patterns
    const treatmentPatterns = [
      /\b(bpc-?157|tb-?500|cjc-?1295|ipamorelin|sermorelin|mk-?677|ghrp-?[26])\b/gi,
      /\b(semaglutide|ozempic|wegovy|tirzepatide|mounjaro)\b/gi,
      /\b(testosterone|trt|hrt|hormone replacement)\b/gi,
      /\b(peptide therapy|peptides)\b/gi,
      /\b(nad\+?|glutathione|iv therapy)\b/gi,
      /\b(prp|platelet rich plasma|stem cell)\b/gi,
      /\b(shockwave|gainswave|acoustic wave)\b/gi
    ];
    
    treatmentPatterns.forEach(pattern => {
      const matches = description.match(pattern) || [];
      matches.forEach(match => {
        const normalized = match.toLowerCase().replace(/\s+/g, ' ').trim();
        terms.add(normalized);
        
        // Add variations
        if (normalized.includes('-')) {
          terms.add(normalized.replace(/-/g, ''));
        }
      });
    });
  }
  
  // Add location terms
  if (clinic.city) {
    terms.add(clinic.city.toLowerCase());
  }
  if (clinic.state) {
    terms.add(clinic.state.toLowerCase());
  }
  
  // Add specialized services
  if (clinic.specializedServices) {
    Object.entries(clinic.specializedServices).forEach(([key, value]) => {
      if (value === true) {
        terms.add(key.toLowerCase());
        
        // Add expanded forms
        const expansions = {
          'trt': 'testosterone replacement therapy',
          'ed': 'erectile dysfunction',
          'hrt': 'hormone replacement therapy'
        };
        
        if (expansions[key.toLowerCase()]) {
          terms.add(expansions[key.toLowerCase()]);
        }
      }
    });
  }
  
  // Add tags
  if (clinic.tags && Array.isArray(clinic.tags)) {
    clinic.tags.forEach(tag => {
      if (tag.length > 2) {
        terms.add(tag.toLowerCase());
      }
    });
  }
  
  return Array.from(terms);
}

/**
 * Update clinics in batches
 */
async function updateClinicsWithSearchableTerms() {
  console.log('🔍 Starting searchable terms update...\n');
  
  let totalProcessed = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let lastDoc = null;
  
  const batchSize = 500;
  const updateBatch = db.batch();
  let batchCount = 0;
  
  try {
    while (true) {
      // Build query
      let query = db.collection('clinics')
        .orderBy('__name__')
        .limit(batchSize);
      
      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }
      
      // Execute query
      const snapshot = await query.get();
      
      if (snapshot.empty) {
        console.log('\n✅ No more clinics to process');
        break;
      }
      
      console.log(`\nProcessing batch of ${snapshot.size} clinics...`);
      
      // Process each clinic
      for (const doc of snapshot.docs) {
        try {
          const clinicData = doc.data();
          totalProcessed++;
          
          // Create searchable terms
          const searchableTerms = createSearchableTerms(clinicData);
          
          // Only update if we have terms and they're different
          const existingTerms = clinicData.searchableTerms || [];
          const hasNewTerms = searchableTerms.length > 0 && 
            (existingTerms.length !== searchableTerms.length ||
             !searchableTerms.every(term => existingTerms.includes(term)));
          
          if (hasNewTerms) {
            updateBatch.update(doc.ref, {
              searchableTerms: searchableTerms,
              'enrichmentData.searchableTermsUpdated': admin.firestore.FieldValue.serverTimestamp()
            });
            
            batchCount++;
            totalUpdated++;
            
            // Log some examples
            if (totalUpdated <= 5) {
              console.log(`\nExample - ${clinicData.name}:`);
              console.log(`  Terms: ${searchableTerms.slice(0, 10).join(', ')}${searchableTerms.length > 10 ? '...' : ''}`);
              console.log(`  Total terms: ${searchableTerms.length}`);
            }
          }
          
          // Commit batch if it's full
          if (batchCount >= 500) {
            await updateBatch.commit();
            console.log(`💾 Committed batch of ${batchCount} updates`);
            batchCount = 0;
          }
          
        } catch (error) {
          console.error(`Error processing clinic ${doc.id}:`, error.message);
          totalErrors++;
        }
      }
      
      // Update lastDoc for pagination
      lastDoc = snapshot.docs[snapshot.docs.length - 1];
      
      // Show progress
      console.log(`Progress: ${totalProcessed} processed, ${totalUpdated} updated, ${totalErrors} errors`);
    }
    
    // Commit any remaining updates
    if (batchCount > 0) {
      await updateBatch.commit();
      console.log(`\n💾 Committed final batch of ${batchCount} updates`);
    }
    
    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Update Summary:');
    console.log('='.repeat(60));
    console.log(`Total clinics processed: ${totalProcessed}`);
    console.log(`Total clinics updated: ${totalUpdated}`);
    console.log(`Total errors: ${totalErrors}`);
    console.log(`Success rate: ${((totalUpdated / totalProcessed) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateClinicsWithSearchableTerms()
  .then(() => {
    console.log('\n✅ Searchable terms update completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Update failed:', error);
    process.exit(1);
  });