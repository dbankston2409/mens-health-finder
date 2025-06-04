import type { NextApiRequest, NextApiResponse } from 'next';
import { regenerateClinicSeo } from '../../apps/worker/utils/seoMetaWriter';
import { admin } from '../../lib/firebase-admin';

interface RegenerateSeoRequest {
  clinicId: string;
  reason?: string;
  requestedBy?: string;
}

interface RegenerateSeoResponse {
  success: boolean;
  message: string;
  data?: {
    clinicId: string;
    fieldsUpdated: string[];
    generatedContent?: {
      title: string;
      description: string;
      keywords: string[];
      content: string;
    };
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RegenerateSeoResponse>
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
    const { clinicId, reason }: RegenerateSeoRequest = req.body;

    // Validate required fields
    if (!clinicId || typeof clinicId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid request',
        error: 'clinicId is required and must be a string'
      });
    }

    // Authentication check
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

    const requestedBy = req.body.requestedBy || authenticatedUser?.name || authenticatedUser?.email || 'API User';
    
    console.log(`🔄 API: Regenerating SEO for clinic ${clinicId}`);
    
    // Regenerate SEO content
    const result = await regenerateClinicSeo(clinicId, requestedBy, reason);

    if (result.success) {
      console.log(`✅ API: SEO regeneration successful for clinic ${clinicId}`);
      
      return res.status(200).json({
        success: true,
        message: 'SEO content regenerated successfully',
        data: {
          clinicId: result.clinicId,
          fieldsUpdated: result.fieldsUpdated,
          generatedContent: result.generatedContent
        }
      });
    } else {
      console.error(`❌ API: SEO regeneration failed for clinic ${clinicId}:`, result.error);
      
      return res.status(500).json({
        success: false,
        message: 'Failed to regenerate SEO content',
        error: result.error || 'Unknown error occurred'
      });
    }

  } catch (error) {
    console.error('❌ API: Regenerate SEO error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

// Optional: Add request size limit for security
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'}}};