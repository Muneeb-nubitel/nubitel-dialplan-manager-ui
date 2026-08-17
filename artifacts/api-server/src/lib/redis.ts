import { createClient } from "redis";

let client: ReturnType<typeof createClient> | undefined;

function requiredEnv(name: "REDIS_HOST" | "REDIS_PORT" | "REDIS_PWD") {
  const value = process.env[name];
  if (!value) throw new Error(`${name} environment variable is required`);
  return value;
}

export async function getRedisClient() {
  if (!client) {
    const port = Number(requiredEnv("REDIS_PORT"));
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error("REDIS_PORT must be a valid port number");
    }

    const socket = process.env["REDIS_TLS"] === "true"
      ? { host: requiredEnv("REDIS_HOST"), port, tls: true as const, connectTimeout: 10_000 }
      : { host: requiredEnv("REDIS_HOST"), port, connectTimeout: 10_000 };

    client = createClient({
      password: requiredEnv("REDIS_PWD"),
      socket,
    });

    client.on("error", () => {
      // Request handlers surface connection failures without logging secrets.
    });
  }

  if (!client.isOpen) await client.connect();
  return client;
}
