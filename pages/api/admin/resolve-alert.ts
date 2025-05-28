import type { NextApiRequest, NextApiResponse } from 'next';
import { resolveAlertById } from '../../../apps/worker/utils/alertEngine';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { alertId } = req.body;
    
    if (!alertId) {
      return res.status(400).json({ error: 'alertId is required' });
    }

    await resolveAlertById(alertId);

    res.status(200).json({
      success: true,
      message: 'Alert resolved successfully'
    });
    
  } catch (error) {
    console.error('Resolve alert API error:', error);
    res.status(500).json({
      error: 'Failed to resolve alert',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}