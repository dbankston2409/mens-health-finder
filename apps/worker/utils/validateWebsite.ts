import fetch from 'node-fetch';

export async function validateWebsiteIsReachable(url: string): Promise<boolean> {
  if (!url || url.trim() === '') {
    return false;
  }
  
  try {
    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }
    
    // Make request with timeout and proper headers
    const response = await fetch(normalizedUrl, {
      method: 'HEAD', // Use HEAD to minimize data transfer
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MensHealthFinder/1.0; +https://menshealthfinder.com)',
        'Accept': '*/*'
      },
      redirect: 'follow' // Follow redirects
    });
    
    // Consider 2xx and 3xx status codes as reachable
    return response.status >= 200 && response.status < 400;
    
  } catch (error) {
    // If HEAD fails, try GET (some servers block HEAD requests)
    try {
      let normalizedUrl = url.trim();
      if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
      }
      
      const response = await fetch(normalizedUrl, {
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MensHealthFinder/1.0; +https://menshealthfinder.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        redirect: 'follow',
        size: 1024 // Limit response size to 1KB for checking
      });
      
      return response.status >= 200 && response.status < 400;
      
    } catch (secondError) {
      console.warn(`Website validation failed for ${url}:`, error);
      return false;
    }
  }
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}