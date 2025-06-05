const admin = require('firebase-admin');

// Initialize admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'mens-health-finder-825e0',
  });
}

const db = admin.firestore();

async function checkDatabase() {
  console.log('Checking Men\'s Health Finder Database...\n');
  
  try {
    // Check clinics
    const clinicsSnapshot = await db.collection('clinics').limit(5).get();
    console.log(`✓ Clinics in database: ${clinicsSnapshot.size}`);
    
    if (clinicsSnapshot.size > 0) {
      console.log('\nFirst few clinics:');
      clinicsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.name} (${data.city}, ${data.state})`);
      });
    } else {
      console.log('  → No clinics found. Ready for import!');
    }
    
    // Check users
    const usersSnapshot = await db.collection('users').limit(5).get();
    console.log(`\n✓ Users in database: ${usersSnapshot.size}`);
    
    // Check if admin exists
    const adminQuery = await db.collection('users').where('role', '==', 'admin').limit(1).get();
    if (!adminQuery.empty) {
      console.log('  → Admin user exists ✓');
    } else {
      console.log('  → No admin user found');
    }
    
  } catch (error) {
    console.error('Error checking database:', error.message);
  }
}

checkDatabase();