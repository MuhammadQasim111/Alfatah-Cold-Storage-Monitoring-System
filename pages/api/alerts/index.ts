import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const result = await query(
      'SELECT * FROM alert ORDER BY ts DESC LIMIT 50'
    );
    res.status(200).json(result.rows || []);
  } catch (error) {
    console.error('Alerts API error:', error);
    res.status(200).json([]); // Return empty array instead of error to prevent frontend crashes
  }
}
