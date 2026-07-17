import Redis from "ioredis";
import { config } from "./config";

const redis = new Redis(config.REDIS_URL);

redis.on("connect", () => {
  console.log("Connected to Redis successfully");
});

redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

export async function refreshTTL(sandboxId: string): Promise<void> {
  await redis.expire(`sandbox:${sandboxId}`, 60 * 20);
}
