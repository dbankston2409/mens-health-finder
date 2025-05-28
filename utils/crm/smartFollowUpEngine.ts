import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, Timestamp } from 'firebase/firestore';
import { CrmContact, CrmActivity } from './crmContactModel';
import { logCrmActivity } from './logCrmActivity';

export interface FollowUpRule {
  id: string;
  name: string;
  description: string;
  conditions: {
    daysSinceLastContact?: number;
    leadScore?: { min?: number; max?: number };
    stage?: string[];
    priority?: string[];
    status?: string[];
    hasOpenTasks?: boolean;
    emailEngagement?: 'low' | 'medium' | 'high';
  };
  actions: {
    type: 'email' | 'task' | 'call_reminder' | 'meeting_request';
    template?: string;
    priority?: 'low' | 'medium' | 'high';
    delay?: number; // hours
    assignTo?: string;
  }[];
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  isActive: boolean;
}

export interface FollowUpTask {
  id: string;
  contactId: string;
  clinicSlug: string;
  type: 'email' | 'call' | 'meeting' | 'custom';
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate: Timestamp;
  assignedTo: string;
  createdBy: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  completedBy?: string;
  ruleId?: string;
  estimatedDuration?: number; // minutes
  actualDuration?: number; // minutes
}

const DEFAULT_FOLLOW_UP_RULES: FollowUpRule[] = [
  {
    id: 'new_lead_welcome',
    name: 'New Lead Welcome Sequence',
    description: 'Welcome email series for new leads',
    conditions: {
      stage: ['new'],
      daysSinceLastContact: 0
    },
    actions: [
      {
        type: 'email',
        template: 'welcome_new_lead',
        delay: 1
      },
      {
        type: 'email',
        template: 'lead_nurture_day_3',
        delay: 72
      },
      {
        type: 'task',
        priority: 'medium',
        delay: 168
      }
    ],
    frequency: 'once',
    isActive: true
  },
  {
    id: 'stale_prospects',
    name: 'Re-engage Stale Prospects',
    description: 'Follow up with prospects who haven\'t been contacted recently',
    conditions: {
      daysSinceLastContact: 7,
      stage: ['contacted', 'qualified'],
      status: ['qualified', 'nurturing']
    },
    actions: [
      {
        type: 'email',
        template: 'reengagement_check_in',
        priority: 'medium'
      }
    ],
    frequency: 'weekly',
    isActive: true
  },
  {
    id: 'high_value_urgent',
    name: 'High-Value Urgent Follow-up',
    description: 'Immediate follow-up for high-value, urgent leads',
    conditions: {
      leadScore: { min: 80 },
      priority: ['urgent', 'high']
    },
    actions: [
      {
        type: 'call_reminder',
        priority: 'urgent',
        delay: 1
      },
      {
        type: 'email',
        template: 'high_priority_followup',
        delay: 2
      }
    ],
    frequency: 'once',
    isActive: true
  },
  {
    id: 'proposal_follow_up',
    name: 'Proposal Follow-up Sequence',
    description: 'Systematic follow-up after proposal is sent',
    conditions: {
      stage: ['proposal'],
      daysSinceLastContact: 3
    },
    actions: [
      {
        type: 'call_reminder',
        priority: 'high',
        delay: 1
      },
      {
        type: 'email',
        template: 'proposal_follow_up',
        delay: 24
      }
    ],
    frequency: 'weekly',
    isActive: true
  },
  {
    id: 'low_engagement_rescue',
    name: 'Low Engagement Rescue Campaign',
    description: 'Re-engage contacts with low email engagement',
    conditions: {
      emailEngagement: 'low',
      daysSinceLastContact: 14,
      status: ['nurturing']
    },
    actions: [
      {
        type: 'email',
        template: 'win_back_campaign',
        priority: 'medium'
      }
    ],
    frequency: 'monthly',
    isActive: true
  }
];

export class SmartFollowUpEngine {
  private rules: FollowUpRule[] = DEFAULT_FOLLOW_UP_RULES;

  async evaluateContact(contact: CrmContact): Promise<FollowUpTask[]> {
    const tasks: FollowUpTask[] = [];
    
    for (const rule of this.rules.filter(r => r.isActive)) {
      if (await this.contactMatchesRule(contact, rule)) {
        const ruleTasks = await this.createTasksFromRule(contact, rule);
        tasks.push(...ruleTasks);
      }
    }
    
    return tasks;
  }

  async evaluateAllContacts(clinicSlug: string): Promise<FollowUpTask[]> {
    const contactsQuery = query(
      collection(db, 'crmContacts'),
      where('clinicSlug', '==', clinicSlug)
    );
    
    const contactsSnapshot = await getDocs(contactsQuery);
    const allTasks: FollowUpTask[] = [];
    
    for (const contactDoc of contactsSnapshot.docs) {
      const contact = { id: contactDoc.id, ...contactDoc.data() } as CrmContact;
      const contactTasks = await this.evaluateContact(contact);
      allTasks.push(...contactTasks);
    }
    
    return allTasks;
  }

  private async contactMatchesRule(contact: CrmContact, rule: FollowUpRule): Promise<boolean> {
    const { conditions } = rule;
    
    // Check days since last contact
    if (conditions.daysSinceLastContact !== undefined) {
      const daysSince = this.getDaysSinceLastContact(contact);
      if (daysSince < conditions.daysSinceLastContact) {
        return false;
      }
    }
    
    // Check lead score range
    if (conditions.leadScore) {
      if (conditions.leadScore.min && contact.leadScore < conditions.leadScore.min) {
        return false;
      }
      if (conditions.leadScore.max && contact.leadScore > conditions.leadScore.max) {
        return false;
      }
    }
    
    // Check stage
    if (conditions.stage && !conditions.stage.includes(contact.pipelineStage)) {
      return false;
    }
    
    // Check priority
    if (conditions.priority && !conditions.priority.includes(contact.priority)) {
      return false;
    }
    
    // Check status
    if (conditions.status && !conditions.status.includes(contact.status)) {
      return false;
    }
    
    // Check email engagement
    if (conditions.emailEngagement) {
      const engagement = this.calculateEmailEngagement(contact);
      if (engagement !== conditions.emailEngagement) {
        return false;
      }
    }
    
    // Check if rule has already been applied recently
    if (rule.frequency !== 'once') {
      const hasRecentApplication = await this.hasRecentRuleApplication(contact.id, rule);
      if (hasRecentApplication) {
        return false;
      }
    }
    
    return true;
  }

  private async createTasksFromRule(contact: CrmContact, rule: FollowUpRule): Promise<FollowUpTask[]> {
    const tasks: FollowUpTask[] = [];
    
    for (const action of rule.actions) {
      const dueDate = Timestamp.fromDate(
        new Date(Date.now() + (action.delay || 0) * 60 * 60 * 1000)
      );
      
      const task: Omit<FollowUpTask, 'id'> = {
        contactId: contact.id,
        clinicSlug: contact.clinicSlug,
        type: action.type === 'call_reminder' ? 'call' : action.type,
        title: this.generateTaskTitle(action, contact),
        description: this.generateTaskDescription(action, rule, contact),
        priority: action.priority || 'medium',
        status: 'pending',
        dueDate,
        assignedTo: action.assignTo || 'unassigned',
        createdBy: 'smart_followup_engine',
        createdAt: Timestamp.now(),
        ruleId: rule.id,
        estimatedDuration: this.getEstimatedDuration(action.type)
      };
      
      // Create task in Firestore
      const taskRef = await addDoc(collection(db, 'followUpTasks'), task);
      tasks.push({ id: taskRef.id, ...task });
    }
    
    return tasks;
  }

  private getDaysSinceLastContact(contact: CrmContact): number {
    if (!contact.lastContactDate) return Infinity;
    
    const now = new Date();
    const lastContact = contact.lastContactDate.toDate();
    const diffTime = Math.abs(now.getTime() - lastContact.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateEmailEngagement(contact: CrmContact): 'low' | 'medium' | 'high' {
    const { emailOpens, emailClicks, totalInteractions } = contact;
    
    if (totalInteractions === 0) return 'low';
    
    const openRate = emailOpens / totalInteractions;
    const clickRate = emailClicks / totalInteractions;
    const engagementScore = (openRate * 0.6) + (clickRate * 0.4);
    
    if (engagementScore >= 0.5) return 'high';
    if (engagementScore >= 0.2) return 'medium';
    return 'low';
  }

  private async hasRecentRuleApplication(contactId: string, rule: FollowUpRule): Promise<boolean> {
    const hours = rule.frequency === 'daily' ? 24 :
                 rule.frequency === 'weekly' ? 168 :
                 rule.frequency === 'monthly' ? 720 : 0;
    
    if (hours === 0) return false;
    
    const cutoffDate = Timestamp.fromDate(new Date(Date.now() - hours * 60 * 60 * 1000));
    
    const tasksQuery = query(
      collection(db, 'followUpTasks'),
      where('contactId', '==', contactId),
      where('ruleId', '==', rule.id),
      where('createdAt', '>', cutoffDate)
    );
    
    const tasksSnapshot = await getDocs(tasksQuery);
    return !tasksSnapshot.empty;
  }

  private generateTaskTitle(action: any, contact: CrmContact): string {
    const name = `${contact.firstName} ${contact.lastName}`;
    
    switch (action.type) {
      case 'email':
        return `Send email to ${name}`;
      case 'call_reminder':
        return `Call ${name}`;
      case 'meeting_request':
        return `Schedule meeting with ${name}`;
      case 'task':
        return `Follow up with ${name}`;
      default:
        return `Contact ${name}`;
    }
  }

  private generateTaskDescription(action: any, rule: FollowUpRule, contact: CrmContact): string {
    let description = `Automated task from rule: ${rule.name}\n\n`;
    
    if (action.template) {
      description += `Email template: ${action.template}\n`;
    }
    
    description += `Contact: ${contact.firstName} ${contact.lastName}\n`;
    description += `Lead Score: ${contact.leadScore}\n`;
    description += `Stage: ${contact.pipelineStage}\n`;
    description += `Priority: ${contact.priority}`;
    
    return description;
  }

  private getEstimatedDuration(taskType: string): number {
    const durations = {
      email: 15,
      call: 30,
      meeting: 60,
      custom: 30
    };
    
    return durations[taskType as keyof typeof durations] || 30;
  }

  async completeTask(taskId: string, completedBy: string, actualDuration?: number, notes?: string): Promise<void> {
    const taskRef = doc(db, 'followUpTasks', taskId);
    
    await updateDoc(taskRef, {
      status: 'completed',
      completedAt: Timestamp.now(),
      completedBy,
      actualDuration
    });
    
    // Log activity if notes provided
    if (notes) {
      const taskDoc = await getDocs(query(collection(db, 'followUpTasks'), where('__name__', '==', taskId)));
      if (!taskDoc.empty) {
        const task = taskDoc.docs[0].data() as FollowUpTask;
        
        await logCrmActivity({
          contactId: task.contactId,
          clinicSlug: task.clinicSlug,
          type: 'note',
          subject: `Completed: ${task.title}`,
          description: notes,
          createdBy: completedBy
        });
      }
    }
  }

  async getTasksForUser(assignedTo: string, clinicSlug?: string): Promise<FollowUpTask[]> {
    let tasksQuery = query(
      collection(db, 'followUpTasks'),
      where('assignedTo', '==', assignedTo),
      where('status', 'in', ['pending', 'in_progress'])
    );
    
    if (clinicSlug) {
      tasksQuery = query(tasksQuery, where('clinicSlug', '==', clinicSlug));
    }
    
    const tasksSnapshot = await getDocs(tasksQuery);
    return tasksSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FollowUpTask));
  }
}