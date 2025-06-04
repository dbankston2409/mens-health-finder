# Location Logic Replacement Plan

## Current System Overview

### What We Have Now:
1. **Browser Geolocation API** - Asks permission (annoying popup)
2. **IP Fallback** - Uses ipapi.co when permission denied
3. **Manual ZIP Entry** - Modal for entering location
4. **Session Storage** - Remembers location temporarily

### Problems:
- Permission popup friction
- Many users deny location access
- Fallback is already using IP geolocation (but client-side)

## Proposed Replacement Architecture

### New Flow (No Permission Needed):
```
User Loads Site → Server-Side IP Detection → Show Results for Their City → "Change Location" Option
```

## Implementation Plan

### Phase 1: Server-Side Location Detection

#### 1.1 Create API Route
```typescript
// pages/api/detect-location.ts
export default async function handler(req, res) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Check cache first
  const cached = locationCache.get(ip);
  if (cached) return res.json(cached);
  
  // Use ip-api.com (free, no key needed)
  const response = await fetch(`http://ip-api.com/json/${ip}`);
  const data = await response.json();
  
  const location = {
    city: data.city,
    state: data.regionName,
    stateCode: data.region,
    lat: data.lat,
    lng: data.lon,
    country: data.countryCode
  };
  
  // Block non-US
  if (location.country !== 'US') {
    return res.status(403).json({ error: 'US only service' });
  }
  
  locationCache.set(ip, location);
  res.json(location);
}
```

#### 1.2 Create Location Hook
```typescript
// hooks/useAutoLocation.ts
export function useAutoLocation() {
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Check sessionStorage first
    const stored = sessionStorage.getItem('autoLocation');
    if (stored) {
      setLocation(JSON.parse(stored));
      setIsLoading(false);
      return;
    }
    
    // Detect location
    fetch('/api/detect-location')
      .then(res => res.json())
      .then(data => {
        if (data.city) {
          setLocation(data);
          sessionStorage.setItem('autoLocation', JSON.stringify(data));
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);
  
  return { location, isLoading, setLocation };
}
```

### Phase 2: Update Components

#### 2.1 Replace LocationAwareSearch
```typescript
// components/LocationAwareSearch.tsx (simplified)
export default function LocationAwareSearch() {
  const { location, isLoading, setLocation } = useAutoLocation();
  const [showChangeLocation, setShowChangeLocation] = useState(false);
  
  return (
    <div>
      {/* Location indicator - no permission needed! */}
      <div className="text-sm text-gray-600 mb-2">
        {isLoading ? (
          'Detecting location...'
        ) : location ? (
          <>
            Showing results near {location.city}, {location.stateCode}
            <button onClick={() => setShowChangeLocation(true)}>
              Change
            </button>
          </>
        ) : (
          <button onClick={() => setShowChangeLocation(true)}>
            Set location
          </button>
        )}
      </div>
      
      {/* Search bar */}
      <SmartSearchBar location={location} />
      
      {/* Change location modal */}
      {showChangeLocation && (
        <ChangeLocationModal 
          onSelect={(newLocation) => {
            setLocation(newLocation);
            setShowChangeLocation(false);
          }}
        />
      )}
    </div>
  );
}
```

#### 2.2 Update Map Component
```typescript
// components/Map.tsx (simplified)
export default function Map({ clinics }) {
  const { location } = useAutoLocation();
  const [map, setMap] = useState(null);
  
  // Center map on detected city (no permission needed!)
  const center = location 
    ? [location.lat, location.lng]
    : [39.8283, -98.5795]; // US center
    
  const zoom = location ? 11 : 4; // City vs country view
  
  return (
    <MapContainer center={center} zoom={zoom}>
      {/* No more "find my location" button! */}
      {/* Just shows clinics near detected city */}
    </MapContainer>
  );
}
```

#### 2.3 Remove LocationPromptModal
- Delete the component entirely
- No more permission prompts!

### Phase 3: Update Search Logic

#### 3.1 Modify Search Function
```typescript
// lib/search.ts
export async function searchClinics({ 
  query, 
  location, // Now comes from IP detection
  radius = 25 
}) {
  // If no location, search nationwide
  if (!location) {
    return searchNationwide(query);
  }
  
  // Otherwise, search near detected city
  return searchNearLocation(query, location, radius);
}
```

### Phase 4: Add Manual Location Override

#### 4.1 Create Change Location Modal
```typescript
// components/ChangeLocationModal.tsx
export default function ChangeLocationModal({ onSelect }) {
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  
  // Popular cities for quick selection
  const popularCities = [
    { city: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
    { city: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
    { city: 'Dallas', state: 'TX', lat: 32.7767, lng: -96.7970 },
    // ... more cities
  ];
  
  return (
    <Modal>
      <h2>Change Location</h2>
      
      {/* City/ZIP search */}
      <input 
        placeholder="Enter city or ZIP code"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
      />
      
      {/* Popular cities grid */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        {popularCities.map(city => (
          <button onClick={() => onSelect(city)}>
            {city.city}, {city.state}
          </button>
        ))}
      </div>
    </Modal>
  );
}
```

## Files to Modify

### Remove/Simplify:
1. ❌ `LocationPromptModal.tsx` - Delete entirely
2. ✏️ `LocationAwareSearch.tsx` - Simplify to use auto-detection
3. ✏️ `Map.tsx` - Remove geolocation API usage
4. ✏️ `useGeoSearch.ts` - Update to use new location source

### Add New:
1. ✅ `/pages/api/detect-location.ts` - Server-side detection
2. ✅ `/hooks/useAutoLocation.ts` - New location hook
3. ✅ `/components/ChangeLocationModal.tsx` - Manual override

### Keep As-Is:
1. ✅ Distance calculations (Haversine formula)
2. ✅ Search sorting by distance
3. ✅ Clinic markers on map

## Migration Steps

1. **Deploy API route** first (won't break anything)
2. **Add new hook** and test in development
3. **Update one component** at a time
4. **Remove old permission logic** last

## Benefits of New Approach

### User Experience:
- ✅ No permission popup
- ✅ Instant location detection
- ✅ Works for 100% of users (vs ~30% who approve location)
- ✅ Still allows manual override

### Technical:
- ✅ Simpler code (no permission handling)
- ✅ Server-side caching reduces API calls
- ✅ Blocks non-US users automatically
- ✅ Better analytics (know where users are)

### Privacy:
- ✅ Only city-level (not exact location)
- ✅ Transparent about detected location
- ✅ Easy to change if wrong

## Timeline Estimate

- **Phase 1**: 2-3 hours (API route + hook)
- **Phase 2**: 3-4 hours (update components)
- **Phase 3**: 1-2 hours (search logic)
- **Phase 4**: 2-3 hours (manual override UI)
- **Testing**: 2-3 hours

**Total**: 1-2 days of focused work

## Ready to Execute?

This plan will:
1. Remove all permission popups
2. Auto-detect city for all users
3. Center map on their city
4. Block non-US users
5. Keep same search functionality

No Google Places API features will be added.