import jwt from "jsonwebtoken";
import type { IncomingMessage } from "http";
import { config } from "./config/config";
import { redis } from "./config/redis";

function extractToken(req: IncomingMessage): string | null {
  const authHeader = req.headers["authorization"];
  if (typeof authHeader === "string") {
    const [scheme, value] = authHeader.split(" ");
    if (scheme?.toLowerCase() === "bearer" && value) return value;
  }

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("token="));
  return match ? decodeURIComponent(match.slice("token=".length)) : null;
}

function getUserId(req: IncomingMessage): string | null {
  const token = extractToken(req);
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as { id?: string };
    return decoded.id ?? null;
  } catch {
    return null;
  }
}

// The `.agent.*` host exposes file read/write and a shell into the sandbox
// pod — only the project's owner may reach it. `.preview.*` (the rendered
// site) is intentionally left open, same as any other preview link.
export async function isAuthorizedForAgent(
  req: IncomingMessage,
  sandboxId: string,
): Promise<boolean> {
  const userId = getUserId(req);
  if (!userId) return false;

  const raw = await redis.get(`sandbox:${sandboxId}`);
  if (!raw) return false;

  try {
    const { userId: ownerId } = JSON.parse(raw) as { userId?: string };
    return !!ownerId && ownerId === userId;
  } catch {
    return false;
  }
}
