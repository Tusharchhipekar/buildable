import Redis from "ioredis";
import { deletePod } from "../kubernetes/pod.js";
import { deleteService } from "../kubernetes/service.js";
import { config } from "./config.js";

const redis = new Redis(config.REDIS_URL);
const subscriber = new Redis(config.REDIS_URL);

export async function createSandboxKey(sandboxId: string) {
  await redis.set(
    `sandbox:${sandboxId}`,
    JSON.stringify({
      status: "active",
    }),
    "EX",
    60 * 120,
  );
}

subscriber.config("SET", "notify-keyspace-events", "Ex");
subscriber.subscribe("__keyevent@0__:expired", (error, count) => {
  if (error) {
    console.error("Error subscribing to keyspace events:", error);
    return;
  }
  console.log(`Subscribed to keyspace events. Active subscriptions: ${count}`);
});

subscriber.on("message", async (channel, Key) => {
  console.log(`Key expired: ${Key}`);

  const sandboxId = Key.split(":")[1];

  // Delete the pod and service
  try {
    await Promise.all([deletePod(sandboxId), deleteService(sandboxId)]);
    console.log("Pod and service deleted successfully");
  } catch (error) {
    console.log("Error deleting pod and service:", error);
  }
});

export { redis, subscriber };
