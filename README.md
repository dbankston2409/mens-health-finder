# Men's Health Finder - Monorepo

A comprehensive platform for finding men's health clinics with admin dashboard and background job processing.

## Project Structure

```
├── apps/
│   ├── web/          # Next.js frontend application
│   └── worker/       # Background job processor
├── packages/
│   └── firebase/     # Shared Firebase admin configuration
├── .env.web         # Web app environment variables
├── .env.worker      # Worker environment variables
└── package.json     # Monorepo scripts
```

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project setup
- Environment variables configured

### Development

1. **Install dependencies:**
   ```bash
   npm install
   cd apps/web && npm install
   ```

2. **Start the web application:**
   ```bash
   npm run dev:web
   ```
   
   The app will be available at http://localhost:3001

3. **Run background jobs:**
   ```bash
   npm run run:worker import
   ```

### Environment Setup

#### Web App (.env.web)
Contains only public Firebase configuration for the frontend.

#### Worker (.env.worker)
Contains Firebase Admin SDK credentials and external API keys for background processing.

### Deployment

#### Web App
Deploy `apps/web` to Vercel, Render, or similar:
- Build command: `npm run build:web`
- Start command: `npm run start:web`

#### Worker
Deploy `apps/worker` as a background service:
- For cron jobs: `npm run run:worker import`
- Schedule daily at 2am for clinic imports

## Features

### Web Application
- Men's health clinic directory
- User authentication and profiles
- Admin dashboard with analytics
- SEO-optimized clinic pages
- Review and rating system

### Background Worker
- Clinic data import/export
- Analytics processing
- Email notifications
- Data cleanup tasks

## Admin Access

1. Create an account at `/signup`
2. Use Firebase Console to add admin role to your user document:
   - `role`: "admin"
   - `isAdmin`: true
3. Access admin dashboard at `/admin/overview`