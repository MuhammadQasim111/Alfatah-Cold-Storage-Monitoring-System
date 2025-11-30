import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { unit_id, hours = '24' } = req.query;

  if (!unit_id) return res.status(400).json({ error: 'Missing unit_id' });

  try {
    const sql = `
      SELECT ts, temperature, humidity 
      FROM reading 
      WHERE unit_id = $1 
      AND ts > NOW() - INTERVAL '${parseInt(hours as string)} hours'
      ORDER BY ts ASC
    `;
    const result = await query(sql, [unit_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
}
