// test-connection.ts
// Run this directly to verify the package can actually reach MongoDB
// and that a model query works end-to-end.
//
// Usage:
//   bun run test-connection.ts
//   (or: npx tsx test-connection.ts / ts-node test-connection.ts)

import { whenConnected, mongoose } from "./index";

async function main() {
  console.log("Waiting for connection...");
  await whenConnected();
  console.log("Connected. readyState:", mongoose.connection.readyState);
  console.log("Connected to db:", mongoose.connection.name);
}

main().catch((err) => {
  console.error("❌ Connection test failed:", err);
  process.exit(1);
});
