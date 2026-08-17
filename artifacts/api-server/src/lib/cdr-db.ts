import pg from "pg";

const { Pool } = pg;
let pool: pg.Pool | undefined;

function requiredEnv(name: "DB_HOST" | "DB_PORT" | "DB_USER" | "DB_PASSWORD" | "DB_NAME") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is required`);
  return value;
}

export function getCdrPool() {
  if (!pool) {
    const port = Number(requiredEnv("DB_PORT"));
    if (!Number.isInteger(port) || port <= 0) throw new Error("DB_PORT must be a valid port number");
    pool = new Pool({
      host: requiredEnv("DB_HOST"),
      port,
      user: requiredEnv("DB_USER"),
      password: requiredEnv("DB_PASSWORD"),
      database: requiredEnv("DB_NAME"),
      ssl: process.env["DB_SSL"] === "false" ? false : { rejectUnauthorized: false },
      max: 5,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
    });
  }
  return pool;
}
