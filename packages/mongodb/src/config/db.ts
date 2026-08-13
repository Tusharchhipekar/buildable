import mongoose from "mongoose";
import { config } from "./config";

let connectPromise: Promise<typeof mongoose> | null = null;

const RETRY_DELAY_MS = 3000;


function autoConnect(): Promise<typeof mongoose> {
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
      setTimeout(() => autoConnect().catch(() => {}), RETRY_DELAY_MS);
      throw err;
    });

  return connectPromise;
}

autoConnect().catch(() => {});

export async function whenConnected() {
  return autoConnect();
}
