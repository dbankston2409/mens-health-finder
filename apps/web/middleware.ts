import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of paths that should always be accessible
const PUBLIC_PATHS = [
  '/us-only',
  '/api/detect-location',
  '/_next',
  '/favicon.ico',
  '/images',
  '/robots.txt',
  '/sitemap.xml'
];

// Check if path should be public
function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(path => pathname.startsWith(path));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }
  
  // Skip middleware for API routes (except detect-location which is public)
  if (pathname.startsWith('/api/') && pathname !== '/api/detect-location') {
    return NextResponse.next();
  }
  
  // Get country from request headers (if using Cloudflare or similar)
  const country = request.headers.get('cf-ipcountry') || 
                 request.geo?.country || 
                 null;
  
  // If we can detect country from headers and it's not US, redirect
  if (country && country !== 'US') {
    return NextResponse.redirect(new URL('/us-only', request.url));
  }
  
  // For production, you might want to do IP-based checking here
  // For now, we'll let the client-side handle it
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes that need to be accessible
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|images/).*)',
  ],
};