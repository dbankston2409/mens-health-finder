# Firebase OAuth Domain Setup

## Issue
You're seeing this warning:
```
The current domain is not authorized for OAuth operations. This will prevent signInWithPopup, signInWithRedirect, linkWithPopup and linkWithRedirect from working.
```

## Solution

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Authentication** → **Settings** → **Authorized domains**
4. Add these domains:
   - `www.menshealthfinder.com`
   - `menshealthfinder.com` (if using apex domain)
   - Any other production domains you use

## Why This Matters

This warning appears because Firebase needs to whitelist domains that can use OAuth authentication methods like:
- Google Sign-In with popup
- Social media logins
- Email link authentication

## Current Impact

- The warning is non-critical if you're only using email/password authentication
- It will only affect OAuth-based login methods (Google, Facebook, etc.)
- The discovery system and other features will work fine despite this warning

## Additional Security

While in the Firebase Console, also check:
- **Project Settings** → **General** → Add your web app domain
- **Authentication** → **Sign-in method** → Ensure your providers are configured correctly