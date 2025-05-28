import axios from 'axios';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface PingResult {
  success: boolean;
  responseStatus?: number;
  responseTime: number;
  error?: string;
  timestamp: Date;
}

export async function pingGSC(sitemapUrl: string, isDev = false): Promise<PingResult> {
  const startTime = Date.now();
  const timestamp = new Date();
  
  try {
    console.log(`🔔 Pinging Google Search Console for sitemap: ${sitemapUrl}`);
    
    if (isDev) {
      // Mock response in development
      console.log('🔧 Development mode: Mocking GSC ping');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      const mockResult: PingResult = {
        success: true,
        responseStatus: 200,
        responseTime: Date.now() - startTime,
        timestamp
      };
      
      await updateAdminStats(mockResult);
      return mockResult;
    }
    
    // Production GSC ping
    const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
    
    const response = await axios.get(pingUrl, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'MensHealthFinder-SitemapBot/1.0'
      }
    });
    
    const result: PingResult = {
      success: response.status === 200,
      responseStatus: response.status,
      responseTime: Date.now() - startTime,
      timestamp
    };
    
    if (result.success) {
      console.log(`✅ GSC ping successful (${result.responseTime}ms)`);
    } else {
      console.log(`⚠️ GSC ping returned status ${response.status}`);
    }
    
    await updateAdminStats(result);
    return result;
    
  } catch (error) {
    const result: PingResult = {
      success: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp
    };
    
    console.error(`❌ GSC ping failed: ${result.error}`);
    await updateAdminStats(result);
    return result;
  }
}

async function updateAdminStats(result: PingResult): Promise<void> {
  try {
    const adminStatsRef = doc(db, 'adminStats', 'seo');
    
    await updateDoc(adminStatsRef, {
      lastSitemapPing: serverTimestamp(),
      lastPingSuccess: result.success,
      lastPingError: result.error || null,
      lastPingResponseTime: result.responseTime,
      lastPingStatus: result.responseStatus || null
    });
    
    console.log('📊 Admin stats updated with ping result');
  } catch (error) {
    console.error('Failed to update admin stats:', error);
  }
}

export async function getPingHistory(limit = 10): Promise<{
  lastPing?: Date;
  success: boolean;
  responseTime?: number;
  error?: string;
}[]> {
  try {
    // In a real implementation, you might store ping history
    // For now, return the last ping from admin stats
    const adminStatsRef = doc(db, 'adminStats', 'seo');
    // This would need to be implemented with proper history tracking
    
    return [];
  } catch (error) {
    console.error('Error getting ping history:', error);
    return [];
  }
}

export function validateSitemapUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.pathname.endsWith('.xml');
  } catch {
    return false;
  }
}

export async function pingMultipleSitemaps(urls: string[], isDev = false): Promise<PingResult[]> {
  console.log(`🔔 Pinging ${urls.length} sitemaps...`);
  
  const results: PingResult[] = [];
  
  for (const url of urls) {
    if (validateSitemapUrl(url)) {
      const result = await pingGSC(url, isDev);
      results.push(result);
      
      // Add delay between pings to be respectful
      if (urls.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else {
      console.warn(`⚠️ Invalid sitemap URL: ${url}`);
      results.push({
        success: false,
        error: 'Invalid sitemap URL',
        responseTime: 0,
        timestamp: new Date()
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ Pinged ${successCount}/${urls.length} sitemaps successfully`);
  
  return results;
}