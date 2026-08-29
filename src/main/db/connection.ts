import mysql from 'mysql2/promise';
import { getStore } from '../config/store';

let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (pool) return pool;

  const s = getStore();
  pool = mysql.createPool({
    host: s.get('db.host') as string,
    port: Number(s.get('db.port', 3306)),
    user: s.get('db.user') as string,
    password: s.get('db.password') as string,
    database: s.get('db.database', 'alesys') as string,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 20,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    timezone: '-03:00',
    decimalNumbers: true,
  });

  return pool;
}

export async function testConnection(): Promise<boolean> {
  try {
    const conn = await getPool().getConnection();
    await conn.ping();
    conn.release();
    return true;
  } catch {
    return false;
  }
}

export async function getConnection() {
  return getPool().getConnection();
}