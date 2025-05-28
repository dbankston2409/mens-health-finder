# Men's Health Finder - Database Tools

This directory contains tools for managing the Men's Health Finder platform database, including:

1. **Firestore Schema Setup** - Creates the database collections and schema
2. **Bulk Import Tool** - Imports clinic data from CSV or JSON files with automatic geocoding and tagging
3. **Traffic Logging** - Tracks clinic views and search patterns

## Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Fill in your Firebase credentials and Google Maps API key in the `.env` file.

## Database Schema

### Clinic Document

```javascript
{
  name: string,              // Clinic name
  slug: string,              // SEO-friendly URL path (e.g., mens-health-scottsdale-az)
  address: string,           // Street address
  city: string,              // City
  state: string,             // State code (e.g., AZ)
  zip: string,               // Postal code
  country: string,           // Country (default: USA)
  lat: number,               // Latitude
  lng: number,               // Longitude
  phone: string,             // Phone number
  website: string,           // Website URL
  services: string[],        // List of services (e.g., TRT, ED Treatment)
  package: string,           // Subscription tier (premium, basic, free)
  status: string,            // Account status (active, paused, canceled)
  tags: string[],            // Tags for filtering
  importSource: string,      // Where the data came from
  createdAt: Timestamp,      // Creation date
  lastUpdated: Timestamp,    // Last update date
  trafficMeta: {
    totalClicks: number,     // Total profile views
    topSearchTerms: string[],// Search terms that led to this clinic
    lastViewed: Timestamp    // Last time profile was viewed
  },
  validationStatus: {
    verified: boolean,       // Verification status
    method: string,          // Verification method (manual, auto)
    websiteOK: boolean       // Whether website is active
  }
}
```

### Traffic Log Document

```javascript
{
  clinicId: string,        // Reference to clinic
  searchQuery: string,     // What the user searched for
  resultingPage: string,   // Clinic slug that was viewed
  timestamp: Timestamp,    // When the view occurred
  userRegion: string       // User's geographic region (if available)
}
```

### Admin Log Document

```javascript
{
  clinicId: string,        // Reference to clinic
  actorId: string,         // Admin user who performed action
  actionType: string,      // Type of action (edit, validate, etc.)
  payload: object,         // Data related to the action
  timestamp: Timestamp     // When the action occurred
}
```

## Usage

### Command Line Interface

The tools can be run individually or demonstrated together:

```bash
# Set up Firestore schema
node scripts/demo.js setup

# Create a sample data file
node scripts/demo.js sample [output-path]

# Import clinics from a file
node scripts/demo.js import <file-path> [import-source]

# Run the full demonstration
node scripts/demo.js demo
```

### Importing Clinics

```bash
# Import from a CSV file
node scripts/tools/importClinics.js import ./sample-clinics.csv

# Import from a JSON file
node scripts/tools/importClinics.js import ./clinics.json

# Specify an import source
node scripts/tools/importClinics.js import ./clinics.json --source yelp-scraper
```

The import tool performs:
- Normalization of phone numbers, websites, etc.
- Geocoding of addresses to latitude/longitude
- Slug generation for URL paths
- Website verification
- Automatic tagging based on data quality

### Logging Clinic Traffic

```javascript
// Import the traffic logging utility
const { logClinicTraffic } = require('./tools/logClinicTraffic');

// Log a clinic view
await logClinicTraffic(
  'mens health near austin',  // Search query
  'premier-mens-health-austin-tx',  // Clinic slug
  'Texas'  // User region (optional)
);

// Get top viewed clinics
const { getTopViewedClinics } = require('./tools/logClinicTraffic');
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
const topClinics = await getTopViewedClinics(thirtyDaysAgo, new Date(), 10);
console.table(topClinics);
```

## Integration with Next.js Application

The tools are integrated with the Next.js application through the Clinic Service:

```javascript
// Import the clinic service
import { 
  getClinicById,
  getClinicBySlug, 
  queryClinics, 
  searchClinics, 
  logClinicTraffic 
} from '../lib/api/clinicService';

// Example: Search for clinics
const results = await searchClinics('testosterone replacement');

// Example: Query clinics with filters
const { clinics, hasMore, lastDoc } = await queryClinics({
  state: 'TX',
  city: 'Austin',
  services: ['TRT', 'ED Treatment']
});

// Example: Get a specific clinic
const clinic = await getClinicBySlug('premier-mens-health-austin-tx');

// Example: Log a clinic view when a user visits the page
await logClinicTraffic(searchQuery, clinic.slug, userRegion);
```

## Notes on Geocoding

- The bulk import tool uses Nominatim (OpenStreetMap) for geocoding by default
- For production, we recommend using the Google Maps Geocoding API
- Set your Google Maps API key in the `.env` file to enable Google geocoding

## Error Handling and Failed Imports

- Failed imports are logged to `import_failures.json` in the same directory as the input file
- Failed imports include the original record and the error reason
- Common failures include invalid addresses for geocoding and invalid website URLs

## Customization

You can customize the import process by modifying the `firestoreSchema.js` and `importClinics.js` files:

- Add new fields to the clinic schema in `firestoreSchema.js`
- Add additional validation or transformation steps in `processClinicRecord()` in `importClinics.js`
- Modify the traffic logging behavior in `logClinicTraffic.js`