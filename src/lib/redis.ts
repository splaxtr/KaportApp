import { createClient } from "redis";
import { logger } from "@/lib/logger";

const REDIS_URL = process.env.REDIS_URL;

type RedisClient = ReturnType<typeof createClient>;

const globalForRedis = globalThis as unknown as {
  redis?: RedisClient;
  redisConnecting?: Promise<RedisClient | null> | null;
};

async function connectRedis(): Promise<RedisClient> {
  const client = createClient({ url: REDIS_URL });
  client.on("error", (err) => {
    logger.error("Redis bağlantı hatası", err instanceof Error ? err : new Error(String(err)));
    // Bağlantı koptuğunda cache'i temizle, tekrar bağlansın
    globalForRedis.redis = undefined;
  });
  await client.connect();
  logger.info("Redis bağlantısı başarılı");
  return client;
}

export async function getRedis(): Promise<RedisClient | null> {
  if (!REDIS_URL) return null;

  // Mevcut bağlantı varsa ve açıksa kullan
  if (globalForRedis.redis?.isOpen) return globalForRedis.redis;

  // Kopmuş bağlantıyı temizle
  if (globalForRedis.redis && !globalForRedis.redis.isOpen) {
    globalForRedis.redis = undefined;
  }

  if (globalForRedis.redisConnecting) return globalForRedis.redisConnecting;

  globalForRedis.redisConnecting = connectRedis()
    .then((client) => {
      globalForRedis.redis = client;
      return client;
    })
    .catch((err) => {
      logger.error("Redis bağlantısı kurulamadı", err instanceof Error ? err : new Error(String(err)));
      return null;
    })
    .finally(() => {
      globalForRedis.redisConnecting = null;
    });

  return globalForRedis.redisConnecting;
}
