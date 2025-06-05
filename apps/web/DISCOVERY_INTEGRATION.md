# Discovery System Integration

## Overview

The discovery system has been integrated to allow the worker process to trigger and manage discovery sessions that are executed by the web app's discovery orchestrator. This provides a bridge between the CLI-based worker and the web app's discovery infrastructure.

## Architecture

### 1. **Extended Data Collector** (`enhancedDataCollector.ts`)
Implements the missing methods required by the discovery orchestrator:

- `searchGrid()`: Searches a geographic grid for clinics using Google Places API
- `extractSocialMediaLinks()`: Scrapes websites for social media profile links
- `getGoogleReviews()`: Placeholder for fetching Google reviews (requires additional API setup)

### 2. **Discovery Bridge** (`discoveryBridge.ts`)
Provides the worker with Firebase-based methods to:

- Create new discovery sessions
- Check session status
- Resume paused sessions
- Pause running sessions
- List all sessions

### 3. **Worker Task Updates** (`runBusinessDiscovery.ts`)
Enhanced to use the discovery bridge with new commands:

- `discovery`: Start or resume a discovery session
- `discovery:status`: Check session status
- `discovery:pause`: Pause a running session

## How It Works

1. **Worker Creates Session**: When you run `npm run worker discovery`, it creates a discovery session document in Firestore with status "pending"

2. **Web App Processes**: The web app's discovery orchestrator monitors for pending sessions and automatically starts processing them

3. **Progress Tracking**: The worker can check progress using `discovery:status` command

4. **Session Management**: Sessions can be paused, resumed, and monitored from the worker CLI

## Implementation Details

### Data Collector Methods

#### searchGrid()
```typescript
async searchGrid(
  grid: DiscoveryGrid,
  searchNiche: SearchNiche | string,
  maxConcurrentSearches: number
): Promise<SearchResult[]>
```
- Performs multiple searches within a grid area
- Uses search terms based on the niche (mensHealth, urgentCare, wellness)
- Implements concurrency control and rate limiting
- Filters results based on relevance to the niche
- Removes duplicates based on address

#### extractSocialMediaLinks()
```typescript
async extractSocialMediaLinks(websiteUrl: string): Promise<{
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
}>
```
- Fetches website HTML content
- Uses regex patterns to find social media links
- Returns normalized URLs for each platform

#### getGoogleReviews()
```typescript
async getGoogleReviews(placeId: string): Promise<Review[]>
```
- Currently returns empty array (requires Google Places API billing)
- Structure is in place for future implementation

### Discovery Bridge Methods

- `startDiscoverySession()`: Creates a new session document
- `getSessionStatus()`: Retrieves current session progress
- `resumeSession()`: Sets session status to "pending" for web app to resume
- `pauseSession()`: Requests pause by setting status to "pause_requested"
- `listSessions()`: Lists recent sessions with basic stats

## Usage Examples

### Start a new discovery session:
```bash
npm run worker discovery --target 5000 --strategy metro_first --niche mensHealth
```

### Check discovery status:
```bash
# List all sessions
npm run worker discovery:status

# Check specific session
npm run worker discovery:status --session discovery_1234567890
```

### Resume a paused session:
```bash
npm run worker discovery --resume discovery_1234567890
```

### Pause a running session:
```bash
npm run worker discovery:pause --session discovery_1234567890
```

## Environment Variables Required

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: For Google Places API
- Firebase configuration variables (same as web app)

## Notes

1. The web app must be running to actually process discovery sessions
2. Sessions created by the worker have a "source: worker" field for identification
3. The discovery orchestrator runs in the web app context with full access to UI components
4. Review import is currently limited due to Google API restrictions
5. Social media extraction works best with well-structured websites

## Future Enhancements

1. Implement actual Google Reviews API integration
2. Add webhook support for real-time progress updates
3. Implement worker-side discovery execution for standalone operation
4. Add support for custom search niches
5. Implement more sophisticated duplicate detection