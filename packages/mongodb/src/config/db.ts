import mongoose from "mongoose";
import { config } from "./config";

let connectPromise: Promise<typeof mongoose> | null = null;

/**
 * Kicks off the connection immediately. Mongoose buffers any queries
 * made before the connection finishes opening and runs them
 * automatically once it's ready — so callers never need to await
 * this themselves (Prisma-style "just import and use").
 */
function autoConnect() {
  if (connectPromise) return connectPromise;

  connectPromise = mongoose
    .connect(config.MONGO_URL)
    .then((m) => {
      console.log("[mongodb] connected to MongoDB");
      return m;
    })
    .catch((err) => {
      console.error("[mongodb] failed to connect to MongoDB:", err.message);
      connectPromise = null;
      throw err;
    });

  return connectPromise;
}

// Fire the connection as soon as this module is first imported.
// Errors are caught here so an unhandled rejection doesn't crash
// the process on import — real connection errors will still surface
// the first time a query actually needs the connection.
autoConnect().catch(() => {});

/**
 * Optional: await this if you want to be certain the connection is
 * live before doing something connection-sensitive (e.g. a startup
 * health check). Not required for normal model queries — those are
 * buffered automatically.
 */
export async function whenConnected() {
  return autoConnect();
}
