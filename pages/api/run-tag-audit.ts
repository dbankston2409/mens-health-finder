import type { NextApiRequest, NextApiResponse } from 'next';
import { runTagAudit } from '../../apps/worker/tasks/runTagAudit';
import { admin } from '../../lib/firebase-admin';

interface RunTagAuditRequest {
  dryRun?: boolean;
  batchSize?: number;
  statusFilter?: string[];
}

interface RunTagAuditResponse {
  success: boolean;
  message: string;
  summary?: {
    totalProcessed: number;
    newTags: number;
    resolvedTags: number;
    criticalIssues: number;
    averageScore: number;
    tagDistribution: Record<string, number>;
    duration: number;
  };
  errors?: string[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RunTagAuditResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed',
      error: 'Only POST requests are allowed'
    });
  }

  try {
    const { dryRun = false, batchSize = 50, statusFilter = ['active'] }: RunTagAuditRequest = req.body;

    // Authentication check (same as regenerate-seo.ts)
    let authenticatedUser = null;
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Check if user is admin
        const userRecord = await admin.auth().getUser(decodedToken.uid);
        const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.exists ? userDoc.data() : {};
        
        const isAdmin = userData?.role === 'admin' || userData?.isAdmin || false;
        
        if (!isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden',
            error: 'Admin access required'
          });
        }
        
        authenticatedUser = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: userRecord.displayName || userData?.name || decodedToken.email
        };
      } else {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: 'Authentication token required'
        });
      }
    } catch (authError) {
      console.error('Authentication error:', authError);
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
        error: 'Invalid authentication token'
      });
    }

    console.log(`🚀 API: Starting tag audit (dryRun: ${dryRun}) requested by ${authenticatedUser?.name}`);
    
    // Run the tag audit
    const result = await runTagAudit({
      dryRun,
      batchSize,
      statusFilter
    });

    if (result.success) {
      console.log(`✅ API: Tag audit completed successfully`);
      
      return res.status(200).json({
        success: true,
        message: dryRun ? 'Tag audit dry run completed successfully' : 'Tag audit completed successfully',
        summary: result.summary,
        errors: result.errors
      });
    } else {
      console.error(`❌ API: Tag audit failed`);
      
      return res.status(500).json({
        success: false,
        message: 'Tag audit failed',
        errors: result.errors,
        error: result.errors?.[0] || 'Unknown error occurred'
      });
    }

  } catch (error) {
    console.error('❌ API: Tag audit error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

// Request size limit for security
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'}}};