// Development mode authentication bypass
// This allows admin access when Firebase is not connected

export const DEV_MODE = process.env.NODE_ENV === 'development';

export interface DevUser {
  uid: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

// Development admin users - these work without Firebase
export const DEV_ADMIN_USERS: DevUser[] = [
  {
    uid: 'dev-admin-1',
    email: 'admin@test.com',
    displayName: 'Dev Admin',
    isAdmin: true
  },
  {
    uid: 'dev-admin-2', 
    email: 'admin@menshealth.com',
    displayName: 'MHF Admin',
    isAdmin: true
  },
  {
    uid: 'dev-user-1',
    email: 'user@test.com', 
    displayName: 'Test User',
    isAdmin: false
  }
];

// Check if email should have admin access in dev mode
export function isDevAdmin(email: string): boolean {
  if (!DEV_MODE) return false;
  
  const adminEmails = [
    'admin@test.com',
    'admin@menshealth.com', 
    'dev@test.com',
    'test@admin.com',
    'admin@example.com'
  ];
  
  return adminEmails.includes(email.toLowerCase());
}

// Get dev user by email
export function getDevUser(email: string): DevUser | null {
  return DEV_ADMIN_USERS.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
}

// Create a mock Firebase user object for dev mode
export function createDevFirebaseUser(devUser: DevUser): any {
  return {
    uid: devUser.uid,
    email: devUser.email,
    displayName: devUser.displayName,
    emailVerified: true,
    photoURL: null,
    getIdToken: async () => 'dev-token',
    // Add other Firebase user properties as needed
  };
}

// Development login function
export function devLogin(email: string, password: string): DevUser | null {
  if (!DEV_MODE) return null;
  
  // Allow any password in dev mode for admin emails
  if (isDevAdmin(email)) {
    return getDevUser(email) || {
      uid: `dev-${Date.now()}`,
      email: email,
      displayName: 'Dev Admin',
      isAdmin: true
    };
  }
  
  // Regular dev user
  return {
    uid: `dev-user-${Date.now()}`,
    email: email,
    displayName: 'Dev User', 
    isAdmin: false
  };
}