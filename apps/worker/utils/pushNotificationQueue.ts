import admin from '../lib/firebase';

export interface PushNotification {
  id?: string;
  clinicSlug: string;
  type: 'reminder' | 'achievement' | 'seo-issue' | 'milestone' | 'warning' | 'tip';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  data?: Record<string, any>;
  scheduledFor?: Date;
  sentAt?: Date;
  readAt?: Date;
  dismissed?: boolean;
  category?: string;
  tags?: string[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationStats {
  totalSent: number;
  totalRead: number;
  totalDismissed: number;
  readRate: number;
  avgResponseTime: number;
  topCategories: Array<{ category: string; count: number }>;
}

export class PushNotificationQueue {
  private db: FirebaseFirestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Add a notification to the queue
   */
  async enqueue(notification: Omit<PushNotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    console.log(`📱 Enqueuing notification for ${notification.clinicSlug}: ${notification.title}`);
    
    try {
      // Check for duplicate notifications (same type and clinic within 24 hours)
      const isDuplicate = await this.checkForDuplicate(notification);
      if (isDuplicate) {
        console.log(`⚠️  Skipping duplicate notification for ${notification.clinicSlug}`);
        return '';
      }
      
      const now = new Date();
      const notificationData: Omit<PushNotification, 'id'> = {
        ...notification,
        createdAt: now,
        updatedAt: now,
        // Set default expiration to 30 days if not provided
        expiresAt: notification.expiresAt || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      };
      
      const docRef = await this.db.collection('notifications').add(notificationData);
      
      console.log(`✅ Notification enqueued: ${docRef.id}`);
      
      // If scheduled for immediate delivery, trigger processing
      if (!notification.scheduledFor || notification.scheduledFor <= now) {
        await this.processNotification(docRef.id, notificationData as PushNotification);
      }
      
      return docRef.id;
      
    } catch (error) {
      console.error('❌ Failed to enqueue notification:', error);
      throw error;
    }
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications(): Promise<void> {
    console.log('🔄 Processing scheduled notifications...');
    
    try {
      const now = new Date();
      
      // Get notifications that are ready to be sent
      const snapshot = await this.db
        .collection('notifications')
        .where('sentAt', '==', null)
        .where('scheduledFor', '<=', now)
        .orderBy('scheduledFor')
        .limit(50) // Process in batches
        .get();
      
      console.log(`📋 Found ${snapshot.size} notifications ready to process`);
      
      const batch = this.db.batch();
      const processPromises: Promise<void>[] = [];
      
      snapshot.docs.forEach(doc => {
        const notification = { id: doc.id, ...doc.data() } as PushNotification;
        
        // Mark as sent
        batch.update(doc.ref, {
          sentAt: now,
          updatedAt: now
        });
        
        // Process the notification
        processPromises.push(this.processNotification(doc.id, notification));
      });
      
      // Commit batch update and process notifications
      await Promise.all([batch.commit(), ...processPromises]);
      
      console.log(`✅ Processed ${snapshot.size} notifications`);
      
    } catch (error) {
      console.error('❌ Failed to process scheduled notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, clinicSlug: string): Promise<void> {
    try {
      const now = new Date();
      
      await this.db.collection('notifications').doc(notificationId).update({
        readAt: now,
        updatedAt: now
      });
      
      // Track engagement
      await this.trackEngagement(notificationId, clinicSlug, 'read');
      
      console.log(`✅ Notification ${notificationId} marked as read`);
      
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      throw error;
    }
  }

  /**
   * Dismiss notification
   */
  async dismiss(notificationId: string, clinicSlug: string): Promise<void> {
    try {
      const now = new Date();
      
      await this.db.collection('notifications').doc(notificationId).update({
        dismissed: true,
        updatedAt: now
      });
      
      // Track engagement
      await this.trackEngagement(notificationId, clinicSlug, 'dismissed');
      
      console.log(`✅ Notification ${notificationId} dismissed`);
      
    } catch (error) {
      console.error('❌ Failed to dismiss notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a clinic
   */
  async getNotifications(
    clinicSlug: string, 
    options: {
      limit?: number;
      unreadOnly?: boolean;
      category?: string;
      includeExpired?: boolean;
    } = {}
  ): Promise<PushNotification[]> {
    try {
      const {
        limit = 20,
        unreadOnly = false,
        category,
        includeExpired = false
      } = options;
      
      let query = this.db
        .collection('notifications')
        .where('clinicSlug', '==', clinicSlug);
      
      if (unreadOnly) {
        query = query.where('readAt', '==', null);
      }
      
      if (category) {
        query = query.where('category', '==', category);
      }
      
      if (!includeExpired) {
        query = query.where('expiresAt', '>', new Date());
      }
      
      const snapshot = await query
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PushNotification[];
      
    } catch (error) {
      console.error('❌ Failed to get notifications:', error);
      throw error;
    }
  }

  /**
   * Clean up expired notifications
   */
  async cleanupExpiredNotifications(): Promise<void> {
    console.log('🧹 Cleaning up expired notifications...');
    
    try {
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days old
      
      // Get expired notifications
      const snapshot = await this.db
        .collection('notifications')
        .where('expiresAt', '<', now)
        .where('createdAt', '<', cutoffDate)
        .limit(100)
        .get();
      
      if (snapshot.empty) {
        console.log('ℹ️  No expired notifications to clean up');
        return;
      }
      
      const batch = this.db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      console.log(`✅ Cleaned up ${snapshot.size} expired notifications`);
      
    } catch (error) {
      console.error('❌ Failed to cleanup expired notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics for a clinic
   */
  async getNotificationStats(clinicSlug: string, days: number = 30): Promise<NotificationStats> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const snapshot = await this.db
        .collection('notifications')
        .where('clinicSlug', '==', clinicSlug)
        .where('createdAt', '>=', cutoffDate)
        .get();
      
      const notifications = snapshot.docs.map(doc => doc.data());
      
      const totalSent = notifications.filter(n => n.sentAt).length;
      const totalRead = notifications.filter(n => n.readAt).length;
      const totalDismissed = notifications.filter(n => n.dismissed).length;
      
      // Calculate average response time
      const responseTimes = notifications
        .filter(n => n.sentAt && n.readAt)
        .map(n => new Date(n.readAt).getTime() - new Date(n.sentAt).getTime());
      
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
        : 0;
      
      // Top categories
      const categoryCount = notifications.reduce((acc, n) => {
        const category = n.category || 'general';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const topCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        totalSent,
        totalRead,
        totalDismissed,
        readRate: totalSent > 0 ? (totalRead / totalSent) * 100 : 0,
        avgResponseTime: Math.round(avgResponseTime / (1000 * 60)), // Convert to minutes
        topCategories
      };
      
    } catch (error) {
      console.error('❌ Failed to get notification stats:', error);
      throw error;
    }
  }

  /**
   * Check for duplicate notifications
   */
  private async checkForDuplicate(notification: Omit<PushNotification, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24); // Check last 24 hours
    
    const snapshot = await this.db
      .collection('notifications')
      .where('clinicSlug', '==', notification.clinicSlug)
      .where('type', '==', notification.type)
      .where('title', '==', notification.title)
      .where('createdAt', '>=', cutoffTime)
      .limit(1)
      .get();
    
    return !snapshot.empty;
  }

  /**
   * Process individual notification
   */
  private async processNotification(notificationId: string, notification: PushNotification): Promise<void> {
    try {
      // In a real implementation, this would send push notifications
      // via Firebase Cloud Messaging, Apple Push Notification service, etc.
      
      console.log(`📱 Processing notification ${notificationId}: ${notification.title}`);
      
      // For now, just log the notification
      // In production, integrate with FCM, APNS, or email service
      
      // Track that the notification was processed
      await this.trackEngagement(notificationId, notification.clinicSlug, 'sent');
      
    } catch (error) {
      console.error(`❌ Failed to process notification ${notificationId}:`, error);
      // Don't throw error to prevent batch failures
    }
  }

  /**
   * Track notification engagement
   */
  private async trackEngagement(
    notificationId: string, 
    clinicSlug: string, 
    action: 'sent' | 'read' | 'dismissed' | 'clicked'
  ): Promise<void> {
    try {
      await this.db.collection('notificationEngagement').add({
        notificationId,
        clinicSlug,
        action,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Failed to track notification engagement:', error);
      // Don't throw error to prevent main operation failures
    }
  }
}

// Export singleton instance
export const notificationQueue = new PushNotificationQueue();

// Helper functions for common notification types
export const NotificationTemplates = {
  seoIssue: (clinicSlug: string, issue: string, score: number) => ({
    clinicSlug,
    type: 'seo-issue' as const,
    priority: 'medium' as const,
    title: 'SEO Issue Detected',
    message: `Your SEO score dropped to ${score}/100. ${issue}`,
    category: 'seo',
    actionUrl: '/admin/seo',
    actionText: 'Fix SEO Issues'
  }),

  achievement: (clinicSlug: string, achievement: string, description: string) => ({
    clinicSlug,
    type: 'achievement' as const,
    priority: 'low' as const,
    title: `🏆 Achievement Unlocked: ${achievement}`,
    message: description,
    category: 'gamification',
    actionUrl: '/admin/achievements',
    actionText: 'View Achievements'
  }),

  reminder: (clinicSlug: string, task: string, urgency: 'low' | 'medium' | 'high' = 'medium') => ({
    clinicSlug,
    type: 'reminder' as const,
    priority: urgency,
    title: 'Action Needed',
    message: task,
    category: 'reminder',
    actionUrl: '/admin/dashboard',
    actionText: 'Take Action'
  }),

  milestone: (clinicSlug: string, milestone: string, value: string) => ({
    clinicSlug,
    type: 'milestone' as const,
    priority: 'medium' as const,
    title: `🎉 Milestone Reached!`,
    message: `${milestone}: ${value}`,
    category: 'milestone',
    actionUrl: '/admin/analytics',
    actionText: 'View Analytics'
  })
};