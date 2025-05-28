const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp({
  projectId: 'mens-health-finder-825e0'
});

async function createAdminUser(email, password, displayName) {
  try {
    // Create the user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: true
    });

    // Set admin custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { 
      admin: true,
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    console.log('✅ Admin user created successfully:');
    console.log('   UID:', userRecord.uid);
    console.log('   Email:', userRecord.email);
    console.log('   Display Name:', userRecord.displayName);
    console.log('   Admin Claims: Set');
    
    // Verify claims were set
    const user = await admin.auth().getUser(userRecord.uid);
    console.log('   Verified Claims:', user.customClaims);

    return userRecord;
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node create-admin-user.js <email> <password> [displayName]');
    console.log('Example: node create-admin-user.js admin@mhf.com mySecurePassword123 "Admin User"');
    process.exit(1);
  }

  const email = args[0];
  const password = args[1];
  const displayName = args[2] || 'Admin User';

  createAdminUser(email, password, displayName)
    .then(() => {
      console.log('\n🎉 Admin user setup complete!');
      console.log('You can now login with these credentials and access admin features.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to create admin user');
      process.exit(1);
    });
}

module.exports = { createAdminUser };