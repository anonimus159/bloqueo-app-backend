import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase requires SSL
});

pool.on('connect', () => {
  console.log('Base de datos PostgreSQL conectada correctamente.');
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de la base de datos:', err);
});

export default {
  query: (text: string, params?: any[]) => pool.query(text, params),
  pool,
};
