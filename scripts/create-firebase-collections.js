const admin = require('firebase-admin');

// Initialize admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'mens-health-finder-825e0',
  });
}

const db = admin.firestore();

async function setupCollections() {
  console.log('Setting up Firestore collections...\n');

  try {
    // 1. Blog Posts Collection
    console.log('Creating blog_posts collection...');
    const blogRef = db.collection('blog_posts').doc('sample-post');
    await blogRef.set({
      title: 'Understanding Testosterone Replacement Therapy',
      slug: 'understanding-testosterone-replacement-therapy',
      excerpt: 'A comprehensive guide to TRT',
      content: 'Full content here...',
      author: 'Dr. Smith',
      publishDate: new Date(),
      categories: ['hormone-therapy', 'mens-health'],
      featuredImage: '/images/blog/trt-guide.jpg',
      status: 'published',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await blogRef.delete(); // Remove sample
    console.log('✓ blog_posts collection ready');

    // 2. Analytics Events Collection
    console.log('\nCreating analytics_events collection...');
    const analyticsRef = db.collection('analytics_events').doc('sample-event');
    await analyticsRef.set({
      event_type: 'clinic_view',
      clinic_id: 'sample-clinic',
      user_id: 'anonymous',
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        source: 'search',
        device: 'mobile',
        location: 'Dallas, TX'
      }
    });
    await analyticsRef.delete();
    console.log('✓ analytics_events collection ready');

    // 3. SEO Content Collection
    console.log('\nCreating seo_content collection...');
    const seoRef = db.collection('seo_content').doc('sample-seo');
    await seoRef.set({
      clinic_id: 'sample-clinic',
      content: 'Generated SEO content...',
      word_count: 750,
      keywords: ['testosterone', 'mens health', 'dallas'],
      generated_at: admin.firestore.FieldValue.serverTimestamp(),
      generated_by: 'ai-engine'
    });
    await seoRef.delete();
    console.log('✓ seo_content collection ready');

    // 4. Import Logs Collection
    console.log('\nCreating import_logs collection...');
    const importRef = db.collection('import_logs').doc('sample-import');
    await importRef.set({
      import_id: 'sample-import',
      filename: 'clinics.csv',
      status: 'completed',
      total_records: 0,
      successful: 0,
      failed: 0,
      started_at: admin.firestore.FieldValue.serverTimestamp(),
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
      imported_by: 'admin@example.com',
      errors: []
    });
    await importRef.delete();
    console.log('✓ import_logs collection ready');

    // 5. Admin Metrics Collection
    console.log('\nCreating admin_metrics collection...');
    const metricsRef = db.collection('admin_metrics').doc('current');
    await metricsRef.set({
      total_clinics: 0,
      active_clinics: 0,
      total_reviews: 0,
      total_users: 0,
      clinics_by_tier: {
        free: 0,
        basic: 0,
        advanced: 0
      },
      revenue_metrics: {
        total: 0,
        monthly: 0,
        growth: 0
      },
      last_updated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✓ admin_metrics collection ready');

    // 6. Alerts Collection
    console.log('\nCreating alerts collection...');
    const alertsRef = db.collection('alerts').doc('sample-alert');
    await alertsRef.set({
      type: 'system',
      priority: 'info',
      title: 'System Ready',
      message: 'All collections initialized',
      status: 'unread',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    await alertsRef.delete();
    console.log('✓ alerts collection ready');

    // 7. Opportunities Collection
    console.log('\nCreating opportunities collection...');
    const oppRef = db.collection('opportunities').doc('sample-opp');
    await oppRef.set({
      clinic_id: 'sample-clinic',
      type: 'upgrade',
      score: 85,
      potential_revenue: 499,
      reasons: ['high_traffic', 'good_reviews'],
      status: 'open',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });
    await oppRef.delete();
    console.log('✓ opportunities collection ready');

    // 8. Outreach Settings Collection
    console.log('\nCreating outreach_settings collection...');
    const outreachRef = db.collection('outreach_settings').doc('default');
    await outreachRef.set({
      email_templates: {
        welcome: {
          subject: 'Welcome to Men\'s Health Finder',
          body: 'Welcome message...'
        },
        upgrade: {
          subject: 'Upgrade Your Listing',
          body: 'Upgrade benefits...'
        }
      },
      automation_enabled: true,
      follow_up_delays: {
        initial: 24,
        reminder: 72,
        final: 168
      },
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✓ outreach_settings collection ready');

    // 9. Traffic Reports Collection
    console.log('\nCreating traffic_reports collection...');
    const trafficRef = db.collection('traffic_reports').doc('sample-report');
    await trafficRef.set({
      clinic_id: 'sample-clinic',
      date: new Date(),
      metrics: {
        views: 0,
        clicks: 0,
        calls: 0,
        conversions: 0
      },
      top_sources: [],
      top_keywords: []
    });
    await trafficRef.delete();
    console.log('✓ traffic_reports collection ready');

    // 10. Worker Jobs Collection
    console.log('\nCreating worker_jobs collection...');
    const jobsRef = db.collection('worker_jobs').doc('sample-job');
    await jobsRef.set({
      type: 'import_clinic',
      status: 'pending',
      data: {},
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      attempts: 0,
      max_attempts: 3
    });
    await jobsRef.delete();
    console.log('✓ worker_jobs collection ready');

    console.log('\n✅ All collections created successfully!');
    
    // Create indexes
    console.log('\n📑 Creating recommended indexes...');
    console.log('Run these in Firebase Console → Firestore → Indexes:');
    console.log('1. clinics: status (asc), tier (desc), name (asc)');
    console.log('2. analytics_events: clinic_id (asc), timestamp (desc)');
    console.log('3. reviews: clinicId (asc), createdAt (desc)');
    console.log('4. worker_jobs: status (asc), created_at (asc)');

  } catch (error) {
    console.error('Error setting up collections:', error);
  }
}

// Run setup
setupCollections();