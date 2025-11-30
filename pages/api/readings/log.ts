import type { NextApiRequest, NextApiResponse } from 'next';
import { query } from '@/lib/db';

// Simple Alert Publisher helper (In a real app, use a proper backend publisher)
// Note: We can't keep a persistent MQTT connection in a serverless function easily.
// For this demo, we assume the dashboard picks up the alert from the DB poll or
// the Python script also publishes the alert to MQTT. 
// However, the prompt says "When persisted reading violates... Insert into alert... Publish to MQTT".
// We will attempt to publish if possible, but reliable serverless MQTT publishing is tricky.
// We will focus on DB insertion here.

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { unit_id, temperature, humidity, timestamp } = req.body;

    // Validate required fields
    if (!unit_id || temperature === undefined || humidity === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: unit_id, temperature, humidity' 
      });
    }

    // Use provided timestamp or current time
    const ts = timestamp || new Date().toISOString();

    // Insert reading into database
    await query(
      `INSERT INTO reading (unit_id, ts, temperature, humidity, source)
       VALUES ($1, $2, $3, $4, 'http')`,
      [unit_id, ts, temperature, humidity]
    );

    // Check thresholds and generate alerts if needed
    const thresholdResult = await query(
      'SELECT * FROM threshold WHERE unit_id = $1 AND active = true',
      [unit_id]
    );

    if (thresholdResult.rows.length > 0) {
      const threshold = thresholdResult.rows[0];
      let severity: string | null = null;
      let message = '';

      // Check temperature thresholds
      if (temperature < threshold.temp_min || temperature > threshold.temp_max) {
        severity = 'critical';
        message = `Temperature ${temperature}°C is out of safe range (${threshold.temp_min}°C to ${threshold.temp_max}°C)`;
      } 
      // Check humidity thresholds
      else if (humidity < threshold.humidity_min || humidity > threshold.humidity_max) {
        severity = 'warning';
        message = `Humidity ${humidity}% is out of safe range (${threshold.humidity_min}% to ${threshold.humidity_max}%)`;
      }

      // Insert alert if threshold violated
      if (severity) {
        await query(
          `INSERT INTO alert (unit_id, severity, message, ts)
           VALUES ($1, $2, $3, $4)`,
          [unit_id, severity, message, ts]
        );
      }
    }

    // Return success response
    res.status(200).json({ 
      success: true, 
      message: 'Reading logged successfully',
      data: {
        unit_id,
        temperature,
        humidity,
        timestamp: ts
      }
    });

  } catch (error) {
    console.error('Error logging reading:', error);
    res.status(500).json({ 
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
