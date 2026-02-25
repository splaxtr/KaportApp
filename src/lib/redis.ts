import { createClient } from "redis";
import { logger } from "@/lib/logger";

const REDIS_URL = process.env.REDIS_URL;

type RedisClient = ReturnType<typeof createClient>;

const globalForRedis = globalThis as unknown as {
  redis?: RedisClient;
  redisConnecting?: Promise<RedisClient> | null;
};

async function connectRedis(): Promise<RedisClient> {
  const client = createClient({ url: REDIS_URL });
  client.on("error", (err) => {
    logger.error("Redis connection error", err instanceof Error ? err : new Error(String(err)));
  });
  await client.connect();
  return client;
}

export async function getRedis(): Promise<RedisClient | null> {
  if (!REDIS_URL) return null;

  if (globalForRedis.redis) return globalForRedis.redis;
  if (globalForRedis.redisConnecting) return globalForRedis.redisConnecting;

  globalForRedis.redisConnecting = connectRedis()
    .then((client) => {
      globalForRedis.redis = client;
      return client;
    })
    .finally(() => {
      globalForRedis.redisConnecting = null;
    });

  return globalForRedis.redisConnecting;
}
