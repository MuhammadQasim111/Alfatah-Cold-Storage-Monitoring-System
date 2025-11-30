import { Pool } from 'pg';

// Use a singleton pattern to prevent multiple pools in serverless dev environment
let pool: Pool;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Neon requires SSL
      },
      max: 10, // Limit connections for serverless
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
};

export const query = async (text: string, params?: any[]) => {
  const p = getPool();
  const start = Date.now();
  try {
    const res = await p.query(text, params);
    return res;
  } catch (err) {
    console.error('Database Query Error', err);
    throw err;
  }
};
