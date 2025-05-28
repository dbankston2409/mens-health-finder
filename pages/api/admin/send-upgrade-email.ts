import type { NextApiRequest, NextApiResponse } from 'next';
import { sendUpgradeEmail } from '../../../apps/worker/tasks/sendUpgradeEmail';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { clinicSlug } = req.body;
    
    if (!clinicSlug) {
      return res.status(400).json({ error: 'clinicSlug is required' });
    }

    const result = await sendUpgradeEmail(clinicSlug);

    if (result.success) {
      res.status(200).json({
        success: true,
        emailId: result.emailId,
        message: 'Upgrade email sent successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send upgrade email'
      });
    }
    
  } catch (error) {
    console.error('Send upgrade email API error:', error);
    res.status(500).json({
      error: 'Failed to send upgrade email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}