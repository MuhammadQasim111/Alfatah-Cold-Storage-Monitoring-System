import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const sql = `
      SELECT DISTINCT ON (unit_id) 
        unit_id, ts, temperature, humidity, source 
      FROM reading 
      ORDER BY unit_id, ts DESC
    `;
    const result = await query(sql);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}
