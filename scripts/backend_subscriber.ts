import mqtt from 'mqtt';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Independent DB connection for this script
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const client = mqtt.connect(`mqtts://${process.env.HIVEMQ_HOST}:8883`, {
  username: process.env.HIVEMQ_USER,
  password: process.env.HIVEMQ_PASS,
  rejectUnauthorized: false
});

client.on('connect', () => {
  console.log('Backend Subscriber Connected to HiveMQ');
  client.subscribe('coldstorage/+/readings');
});

client.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    const { unit_id, temperature, humidity, timestamp } = payload;
    
    // Fallback timestamp
    const ts = timestamp || new Date().toISOString();

    console.log(`Received: Unit ${unit_id} | ${temperature}C | ${humidity}%`);

    await pool.query(
      `INSERT INTO reading (unit_id, ts, temperature, humidity, source)
       VALUES ($1, $2, $3, $4, 'mqtt')`,
      [unit_id, ts, temperature, humidity]
    );

    // Simple Alert Logic (Duplicated from API for robustness)
    const tRes = await pool.query('SELECT * FROM threshold WHERE unit_id = $1 AND active = true', [unit_id]);
    const threshold = tRes.rows[0];

    if (threshold) {
        let severity = null;
        let msg = '';
        if (temperature < threshold.temp_min || temperature > threshold.temp_max) {
            severity = 'critical';
            msg = `Temp ${temperature}C out of range`;
        } else if (humidity < threshold.humidity_min || humidity > threshold.humidity_max) {
            severity = 'warning';
            msg = `Humidity ${humidity}% out of range`;
        }

        if (severity) {
            await pool.query(
                `INSERT INTO alert (unit_id, severity, message, ts) VALUES ($1, $2, $3, $4)`,
                [unit_id, severity, msg, ts]
            );
            
            // Publish alert back to MQTT so UI sees it instantly
            const alertPayload = {
                unit_id, severity, message: msg, ts, resolved: false
            };
            client.publish('coldstorage/alerts', JSON.stringify(alertPayload));
            console.log("Alert Generated & Published");
        }
    }

  } catch (err) {
    console.error('Error processing message:', err);
  }
});

client.on('error', (err) => {
  console.error('MQTT Error:', err);
});
