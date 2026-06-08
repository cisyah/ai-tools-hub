import mysql from "mysql2/promise";

const globalForPool = globalThis as unknown as {
  mysqlPool?: mysql.Pool;
};

export function getPool(): mysql.Pool {
  if (!globalForPool.mysqlPool) {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL is required.");
    }

    globalForPool.mysqlPool = mysql.createPool(databaseUrl);
  }

  return globalForPool.mysqlPool;
}
