import { doc, setDoc, getDoc, serverTimestamp } from '../lib/firebase-compat';
import { db } from '../lib/firebase';

interface AdminStats {
  totalIndexed?: number;
  totalUnindexed?: number;
  lastPingTime?: Date;
  lastIndexCheck?: Date;
  mostIndexedCities?: string[];
  commonTerms?: string[];
  indexingStats?: {
    mostCommonQuery: string;
    mostIndexedState: string;
    avgCTR: number;
    totalClicks: number;
  };
  sitemapStats?: {
    totalUrls: number;
    lastGenerated: Date;
    lastPingSuccess: boolean;
  };
}

export async function updateAdminStats(updates: Partial<AdminStats>): Promise<void> {
  try {
    console.log('📊 Updating admin stats...');
    
    const statsRef = doc(db, 'adminStats', 'seo');
    
    // Get existing stats to merge
    const existingDoc = await getDoc(statsRef);
    const existingStats = existingDoc.exists() ? existingDoc.data() : {};
    
    // Prepare update data with timestamps
    const updateData: any = {
      ...existingStats,
      ...updates,
      lastUpdated: serverTimestamp()
    };
    
    // Convert Date objects to Firestore timestamps for specific fields
    if (updates.lastPingTime) {
      updateData.lastPingTime = serverTimestamp();
    }
    
    if (updates.lastIndexCheck) {
      updateData.lastIndexCheck = serverTimestamp();
    }
    
    await setDoc(statsRef, updateData, { merge: true });
    
    console.log('✅ Admin stats updated successfully');
    
  } catch (error) {
    console.error('❌ Failed to update admin stats:', error);
    throw error;
  }
}

export async function getAdminStats(): Promise<AdminStats> {
  try {
    const statsRef = doc(db, 'adminStats', 'seo');
    const statsDoc = await getDoc(statsRef);
    
    if (statsDoc.exists()) {
      const data = statsDoc.data();
      
      // Convert Firestore timestamps back to Date objects
      return {
        ...data,
        lastPingTime: data.lastPingTime?.toDate(),
        lastIndexCheck: data.lastIndexCheck?.toDate(),
        lastUpdated: data.lastUpdated?.toDate()
      } as AdminStats;
    }
    
    return {};
  } catch (error) {
    console.error('Error getting admin stats:', error);
    return {};
  }
}

export async function updateSitemapStats(stats: {
  totalUrls: number;
  lastGenerated: Date;
  lastPingSuccess: boolean;
}): Promise<void> {
  await updateAdminStats({
    sitemapStats: stats
  });
}

export async function incrementStat(
  statName: keyof AdminStats, 
  incrementBy = 1
): Promise<void> {
  try {
    const currentStats = await getAdminStats();
    const currentValue = (currentStats[statName] as number) || 0;
    
    await updateAdminStats({
      [statName]: currentValue + incrementBy
    });
    
  } catch (error) {
    console.error(`Failed to increment stat ${statName}:`, error);
  }
}

export async function setCommonTerms(terms: string[]): Promise<void> {
  await updateAdminStats({
    commonTerms: terms.slice(0, 20) // Limit to top 20
  });
}

export async function setMostIndexedCities(cities: string[]): Promise<void> {
  await updateAdminStats({
    mostIndexedCities: cities.slice(0, 10) // Limit to top 10
  });
}

export async function resetStats(): Promise<void> {
  try {
    console.log('🔄 Resetting admin stats...');
    
    const statsRef = doc(db, 'adminStats', 'seo');
    
    await setDoc(statsRef, {
      totalIndexed: 0,
      totalUnindexed: 0,
      lastPingTime: null,
      lastIndexCheck: null,
      mostIndexedCities: [],
      commonTerms: [],
      indexingStats: {
        mostCommonQuery: '',
        mostIndexedState: '',
        avgCTR: 0,
        totalClicks: 0
      },
      sitemapStats: {
        totalUrls: 0,
        lastGenerated: null,
        lastPingSuccess: false
      },
      lastUpdated: serverTimestamp()
    });
    
    console.log('✅ Admin stats reset successfully');
    
  } catch (error) {
    console.error('❌ Failed to reset admin stats:', error);
    throw error;
  }
}

export async function getStatsSnapshot(): Promise<{
  timestamp: Date;
  stats: AdminStats;
}> {
  const stats = await getAdminStats();
  
  return {
    timestamp: new Date(),
    stats
  };
}