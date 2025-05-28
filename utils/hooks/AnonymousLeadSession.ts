import { db } from '../../lib/firebase';
import { collection, addDoc, doc, updateDoc, getDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';

export interface SessionAction {
  action: string;
  timestamp: Date;
  data?: Record<string, any>;
  elementId?: string;
  url?: string;
}

export interface LeadSession {
  id: string;
  clinicSlug?: string;
  sessionId: string;
  userId?: string;
  email?: string;
  phone?: string;
  path: string;
  referrer: string;
  userAgent: string;
  ipAddress: string;
  actions: SessionAction[];
  dwellTime: number; // seconds
  createdAt: Date;
  lastActivity: Date;
  converted: boolean;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browserName: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
}

class AnonymousLeadSessionManager {
  private sessionId: string;
  private clinicSlug?: string;
  private sessionStartTime: number;
  private lastActivityTime: number;
  private actions: SessionAction[] = [];
  private isActive: boolean = false;
  private saveTimer?: NodeJS.Timeout;
  private activityTimer?: NodeJS.Timeout;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    
    this.initializeSession();
    this.setupEventListeners();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    // Get or create session ID from localStorage
    const existingSessionId = localStorage.getItem('mhf_session_id');
    const sessionTimestamp = localStorage.getItem('mhf_session_timestamp');
    
    // Session expires after 30 minutes of inactivity
    const sessionExpiry = 30 * 60 * 1000;
    const now = Date.now();
    
    if (existingSessionId && sessionTimestamp) {
      const lastActivity = parseInt(sessionTimestamp);
      if (now - lastActivity < sessionExpiry) {
        this.sessionId = existingSessionId;
      }
    }
    
    localStorage.setItem('mhf_session_id', this.sessionId);
    localStorage.setItem('mhf_session_timestamp', now.toString());
    
    this.isActive = true;
  }

  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackAction('page-hidden');
        this.saveSession();
      } else {
        this.trackAction('page-visible');
        this.lastActivityTime = Date.now();
      }
    });

    // Track scroll events (throttled)
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackScrollEvent();
      }, 1000);
    });

    // Track clicks
    document.addEventListener('click', (event) => {
      this.trackClickEvent(event);
    });

    // Track form interactions
    document.addEventListener('focus', (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        this.trackAction('form-focus', {
          fieldType: event.target.type,
          fieldName: event.target.name || event.target.id
        });
      }
    }, true);

    // Save session before page unload
    window.addEventListener('beforeunload', () => {
      this.saveSession();
    });

    // Auto-save every 30 seconds
    this.saveTimer = setInterval(() => {
      if (this.isActive) {
        this.saveSession();
      }
    }, 30000);

    // Track activity timeout
    this.resetActivityTimer();
  }

  private resetActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    
    // Mark session as inactive after 30 minutes
    this.activityTimer = setTimeout(() => {
      this.isActive = false;
      this.saveSession();
    }, 30 * 60 * 1000);
  }

  public setClinicContext(clinicSlug: string): void {
    this.clinicSlug = clinicSlug;
    this.trackAction('clinic-page-visit', { clinicSlug });
  }

  public setUserContext(email?: string, phone?: string, userId?: string): void {
    if (email || phone || userId) {
      this.trackAction('user-identified', { 
        hasEmail: !!email, 
        hasPhone: !!phone, 
        hasUserId: !!userId 
      });
    }
  }

  public trackAction(action: string, data?: Record<string, any>): void {
    if (!this.isActive) return;

    const sessionAction: SessionAction = {
      action,
      timestamp: new Date(),
      data,
      url: window.location.href
    };

    this.actions.push(sessionAction);
    this.lastActivityTime = Date.now();
    this.resetActivityTimer();

    // Update localStorage timestamp
    localStorage.setItem('mhf_session_timestamp', this.lastActivityTime.toString());

    // Auto-save if important action
    if (this.isImportantAction(action)) {
      this.saveSession();
    }
  }

  private trackScrollEvent(): void {
    const scrollPercent = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );

    // Only track significant scroll milestones
    if (scrollPercent >= 25 && !this.hasActionType('scrolled-25')) {
      this.trackAction('scrolled-25', { scrollPercent });
    } else if (scrollPercent >= 50 && !this.hasActionType('scrolled-50')) {
      this.trackAction('scrolled-50', { scrollPercent });
    } else if (scrollPercent >= 75 && !this.hasActionType('scrolled-75')) {
      this.trackAction('scrolled-75', { scrollPercent });
    } else if (scrollPercent >= 90 && !this.hasActionType('scrolled-90')) {
      this.trackAction('scrolled-90', { scrollPercent });
    }
  }

  private trackClickEvent(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    
    if (!target) return;

    // Track specific click types
    if (target.closest('a[href^="tel:"]')) {
      this.trackAction('clicked-call', {
        phoneNumber: target.closest('a')?.href.replace('tel:', ''),
        elementText: target.textContent?.trim()
      });
    } else if (target.closest('a[href*="maps"]') || target.closest('a[href*="directions"]')) {
      this.trackAction('clicked-directions', {
        url: target.closest('a')?.href,
        elementText: target.textContent?.trim()
      });
    } else if (target.closest('button[type="submit"]') || target.closest('input[type="submit"]')) {
      this.trackAction('clicked-submit', {
        formId: target.closest('form')?.id,
        buttonText: target.textContent?.trim()
      });
    } else if (target.closest('.review-section') || target.closest('[data-review]')) {
      this.trackAction('clicked-review-section', {
        elementText: target.textContent?.trim()
      });
    } else if (target.closest('.services-section') || target.closest('[data-services]')) {
      this.trackAction('viewed-services', {
        elementText: target.textContent?.trim()
      });
    }
  }

  private hasActionType(actionType: string): boolean {
    return this.actions.some(action => action.action === actionType);
  }

  private isImportantAction(action: string): boolean {
    const importantActions = [
      'clicked-call',
      'form-submitted',
      'clicked-directions',
      'review-started',
      'lead-submitted'
    ];
    return importantActions.includes(action);
  }

  public async saveSession(): Promise<void> {
    if (!this.isActive || this.actions.length === 0) return;

    try {
      const sessionData: Partial<LeadSession> = {
        sessionId: this.sessionId,
        clinicSlug: this.clinicSlug,
        path: window.location.pathname,
        referrer: document.referrer || 'direct',
        userAgent: navigator.userAgent,
        ipAddress: await this.getClientIP(),
        actions: this.actions,
        dwellTime: Math.round((this.lastActivityTime - this.sessionStartTime) / 1000),
        lastActivity: new Date(this.lastActivityTime),
        converted: this.hasConversionAction(),
        deviceType: this.getDeviceType(),
        browserName: this.getBrowserName()
      };

      // Check if session document exists
      const sessionsRef = collection(db, 'leadSessions');
      const existingSession = await this.findExistingSession();

      if (existingSession) {
        // Update existing session
        await updateDoc(doc(db, 'leadSessions', existingSession.id), {
          actions: arrayUnion(...this.actions.slice(-10)), // Add only new actions
          dwellTime: sessionData.dwellTime,
          lastActivity: sessionData.lastActivity,
          converted: sessionData.converted
        });
      } else {
        // Create new session
        await addDoc(sessionsRef, {
          ...sessionData,
          createdAt: serverTimestamp()
        });
      }

      // Clear saved actions to avoid duplicates
      this.actions = [];

    } catch (error) {
      console.error('Error saving lead session:', error);
    }
  }

  private async findExistingSession(): Promise<{ id: string } | null> {
    try {
      // In a real implementation, you'd query Firestore to find existing session
      // For now, we'll create a new session each time
      return null;
    } catch (error) {
      return null;
    }
  }

  private hasConversionAction(): boolean {
    const conversionActions = ['form-submitted', 'review-submitted', 'called-clinic'];
    return this.actions.some(action => conversionActions.includes(action.action));
  }

  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/tablet|ipad|android(?!.*mobile)/i.test(userAgent)) {
      return 'tablet';
    } else if (/mobile|iphone|android/i.test(userAgent)) {
      return 'mobile';
    } else {
      return 'desktop';
    }
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Unknown';
  }

  private async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  public destroy(): void {
    this.isActive = false;
    
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }
    
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }
    
    this.saveSession();
  }
}

// Global session manager instance
let sessionManager: AnonymousLeadSessionManager | null = null;

// Hook for React components
export function useAnonymousLeadSession() {
  if (typeof window === 'undefined') {
    return {
      trackAction: () => {},
      setClinicContext: () => {},
      setUserContext: () => {},
      saveSession: async () => {}
    };
  }

  if (!sessionManager) {
    sessionManager = new AnonymousLeadSessionManager();
  }

  return {
    trackAction: (action: string, data?: Record<string, any>) => 
      sessionManager?.trackAction(action, data),
    setClinicContext: (clinicSlug: string) => 
      sessionManager?.setClinicContext(clinicSlug),
    setUserContext: (email?: string, phone?: string, userId?: string) => 
      sessionManager?.setUserContext(email, phone, userId),
    saveSession: () => sessionManager?.saveSession()
  };
}

// Standalone function for direct usage
export async function trackSessionEvent(action: string, data?: Record<string, any>): Promise<void> {
  if (typeof window === 'undefined') return;
  
  if (!sessionManager) {
    sessionManager = new AnonymousLeadSessionManager();
  }
  
  sessionManager.trackAction(action, data);
}

// Initialize session tracking when module loads
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    if (!sessionManager) {
      sessionManager = new AnonymousLeadSessionManager();
    }
  });
  
  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (sessionManager) {
      sessionManager.destroy();
    }
  });
}