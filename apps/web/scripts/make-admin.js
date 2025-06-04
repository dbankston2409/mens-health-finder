#!/usr/bin/env node

/**
 * Men's Health Finder - Make Admin Script
 * 
 * This script adds admin role to a user in Firestore
 * Usage: node make-admin.js user@email.com
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, updateDoc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');
require('dotenv').config({ path: '../.env.local' });

// Your Firebase configuration from env variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Get email from command line arguments
const userEmail = process.argv[2];

if (!userEmail) {
  console.error('❌ Please provide a user email as an argument');
  console.log('Usage: node make-admin.js user@email.com');
  process.exit(1);
}

async function makeAdmin(email) {
  try {
    console.log(`🔍 Looking for user with email: ${email}`);
    
    // Query for user by email
    const usersCollection = collection(db, 'users');
    const q = query(usersCollection, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error(`❌ No user found with email: ${email}`);
      return;
    }
    
    // Get the first matching user
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log(`✅ User found: ${userData.name} (${userData.email})`);
    
    // Update user with admin role
    await updateDoc(doc(db, 'users', userDoc.id), {
      role: 'admin',
      isAdmin: true,
      updatedAt: new Date()
    });
    
    console.log(`🚀 Successfully granted admin privileges to ${userData.name}`);
    console.log(`📝 You can now access the admin dashboard at: http://localhost:3000/admin/overview`);
    
  } catch (error) {
    console.error('❌ Error making user admin:', error);
  }
}

// For direct module execution
if (require.main === module) {
  makeAdmin(userEmail)
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { makeAdmin };