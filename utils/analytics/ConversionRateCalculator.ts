import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { ConversionEvent, ConversionRate } from './conversionModels';

export class ConversionRateCalculator {
  async calculateConversionRate({
    clinicSlug,
    startDate,
    endDate,
    segmentBy = []
  }: {
    clinicSlug: string;
    startDate: Date;
    endDate: Date;
    segmentBy?: string[];
  }): Promise<ConversionRate> {
    try {
      // Get all conversion events for the period
      const conversionsQuery = query(
        collection(db, 'conversionEvents'),
        where('clinicSlug', '==', clinicSlug),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate))
      );

      const conversionsSnapshot = await getDocs(conversionsQuery);
      const conversions = conversionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConversionEvent));

      // Get total page views for the period (approximated from session events)
      const totalViews = await this.getTotalViews(clinicSlug, startDate, endDate);
      const totalConversions = conversions.length;
      const conversionRate = totalViews > 0 ? (totalConversions / totalViews) * 100 : 0;

      // Calculate segmented conversion rates
      const segmentation = {
        byType: this.segmentByType(conversions, totalViews),
        bySource: this.segmentBySource(conversions, totalViews),
        byDevice: this.segmentByDevice(conversions, totalViews),
        byVariant: this.segmentByVariant(conversions, totalViews)
      };

      // Calculate trends
      const trends = {
        daily: await this.calculateDailyTrends(clinicSlug, startDate, endDate),
        weekly: await this.calculateWeeklyTrends(clinicSlug, startDate, endDate)
      };

      const result: ConversionRate = {
        clinicSlug,
        period: `${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}`,
        totalViews,
        totalConversions,
        conversionRate,
        segmentation,
        trends,
        updatedAt: Timestamp.now()
      };

      return result;
    } catch (error) {
      console.error('Error calculating conversion rate:', error);
      throw new Error('Failed to calculate conversion rate');
    }
  }

  async calculateOverallConversionRate(clinicSlug: string, days: number = 30): Promise<number> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const result = await this.calculateConversionRate({ clinicSlug, startDate, endDate });
    return result.conversionRate;
  }

  async calculateConversionRateByType(clinicSlug: string, conversionType: string, days: number = 30): Promise<number> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const conversionsQuery = query(
      collection(db, 'conversionEvents'),
      where('clinicSlug', '==', clinicSlug),
      where('type', '==', conversionType),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate))
    );

    const conversionsSnapshot = await getDocs(conversionsQuery);
    const totalViews = await this.getTotalViews(clinicSlug, startDate, endDate);
    
    return totalViews > 0 ? (conversionsSnapshot.size / totalViews) * 100 : 0;
  }

  async getTopPerformingVariants(clinicSlug: string, days: number = 30): Promise<Array<{
    variantId: string;
    conversions: number;
    views: number;
    conversionRate: number;
  }>> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    const conversionsQuery = query(
      collection(db, 'conversionEvents'),
      where('clinicSlug', '==', clinicSlug),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate))
    );

    const conversionsSnapshot = await getDocs(conversionsQuery);
    const conversions = conversionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ConversionEvent));

    // Group by variant
    const variantStats = new Map<string, { conversions: number; views: number }>();
    
    conversions.forEach(conversion => {
      if (conversion.variantId) {
        const current = variantStats.get(conversion.variantId) || { conversions: 0, views: 0 };
        current.conversions++;
        variantStats.set(conversion.variantId, current);
      }
    });

    // Get total views per variant (would need session tracking for accuracy)
    const totalViews = await this.getTotalViews(clinicSlug, startDate, endDate);
    const avgViewsPerVariant = Math.floor(totalViews / Math.max(variantStats.size, 1));

    return Array.from(variantStats.entries()).map(([variantId, stats]) => ({
      variantId,
      conversions: stats.conversions,
      views: avgViewsPerVariant, // Approximation - would need better tracking
      conversionRate: avgViewsPerVariant > 0 ? (stats.conversions / avgViewsPerVariant) * 100 : 0
    })).sort((a, b) => b.conversionRate - a.conversionRate);
  }

  private async getTotalViews(clinicSlug: string, startDate: Date, endDate: Date): Promise<number> {
    // In a real implementation, you'd track page views separately
    // For now, we'll estimate based on session events or use a default multiplier
    const conversionsQuery = query(
      collection(db, 'conversionEvents'),
      where('clinicSlug', '==', clinicSlug),
      where('timestamp', '>=', Timestamp.fromDate(startDate)),
      where('timestamp', '<=', Timestamp.fromDate(endDate))
    );

    const conversionsSnapshot = await getDocs(conversionsQuery);
    // Assume 1 conversion per 20 views (5% conversion rate baseline)
    return Math.max(conversionsSnapshot.size * 20, 100);
  }

  private segmentByType(conversions: ConversionEvent[], totalViews: number): Record<string, { views: number; conversions: number; rate: number }> {
    const typeGroups = conversions.reduce((acc, conversion) => {
      acc[conversion.type] = (acc[conversion.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result: Record<string, { views: number; conversions: number; rate: number }> = {};
    const avgViewsPerType = Math.floor(totalViews / Math.max(Object.keys(typeGroups).length, 1));

    Object.entries(typeGroups).forEach(([type, count]) => {
      result[type] = {
        views: avgViewsPerType,
        conversions: count,
        rate: avgViewsPerType > 0 ? (count / avgViewsPerType) * 100 : 0
      };
    });

    return result;
  }

  private segmentBySource(conversions: ConversionEvent[], totalViews: number): Record<string, { views: number; conversions: number; rate: number }> {
    const sourceGroups = conversions.reduce((acc, conversion) => {
      const source = conversion.metadata?.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result: Record<string, { views: number; conversions: number; rate: number }> = {};
    const avgViewsPerSource = Math.floor(totalViews / Math.max(Object.keys(sourceGroups).length, 1));

    Object.entries(sourceGroups).forEach(([source, count]) => {
      result[source] = {
        views: avgViewsPerSource,
        conversions: count,
        rate: avgViewsPerSource > 0 ? (count / avgViewsPerSource) * 100 : 0
      };
    });

    return result;
  }

  private segmentByDevice(conversions: ConversionEvent[], totalViews: number): Record<string, { views: number; conversions: number; rate: number }> {
    const deviceGroups = conversions.reduce((acc, conversion) => {
      const device = conversion.metadata?.device || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result: Record<string, { views: number; conversions: number; rate: number }> = {};
    const avgViewsPerDevice = Math.floor(totalViews / Math.max(Object.keys(deviceGroups).length, 1));

    Object.entries(deviceGroups).forEach(([device, count]) => {
      result[device] = {
        views: avgViewsPerDevice,
        conversions: count,
        rate: avgViewsPerDevice > 0 ? (count / avgViewsPerDevice) * 100 : 0
      };
    });

    return result;
  }

  private segmentByVariant(conversions: ConversionEvent[], totalViews: number): Record<string, { views: number; conversions: number; rate: number }> {
    const variantGroups = conversions.reduce((acc, conversion) => {
      const variant = conversion.variantId || 'control';
      acc[variant] = (acc[variant] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result: Record<string, { views: number; conversions: number; rate: number }> = {};
    const avgViewsPerVariant = Math.floor(totalViews / Math.max(Object.keys(variantGroups).length, 1));

    Object.entries(variantGroups).forEach(([variant, count]) => {
      result[variant] = {
        views: avgViewsPerVariant,
        conversions: count,
        rate: avgViewsPerVariant > 0 ? (count / avgViewsPerVariant) * 100 : 0
      };
    });

    return result;
  }

  private async calculateDailyTrends(clinicSlug: string, startDate: Date, endDate: Date): Promise<{ date: string; rate: number }[]> {
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
    const trends: { date: string; rate: number }[] = [];

    for (let i = 0; i < days; i++) {
      const dayStart = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      const dayEnd = new Date(dayStart.getTime() + (24 * 60 * 60 * 1000));
      
      const dayRate = await this.calculateConversionRate({
        clinicSlug,
        startDate: dayStart,
        endDate: dayEnd
      });

      trends.push({
        date: dayStart.toISOString().split('T')[0],
        rate: dayRate.conversionRate
      });
    }

    return trends;
  }

  private async calculateWeeklyTrends(clinicSlug: string, startDate: Date, endDate: Date): Promise<{ week: string; rate: number }[]> {
    const weeks = Math.ceil((endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    const trends: { week: string; rate: number }[] = [];

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000));
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      const weekRate = await this.calculateConversionRate({
        clinicSlug,
        startDate: weekStart,
        endDate: weekEnd
      });

      trends.push({
        week: `Week of ${weekStart.toISOString().split('T')[0]}`,
        rate: weekRate.conversionRate
      });
    }

    return trends;
  }
}

export const conversionRateCalculator = new ConversionRateCalculator();