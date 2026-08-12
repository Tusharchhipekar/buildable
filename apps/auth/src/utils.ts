import jwt from "jsonwebtoken";
import { config } from "./config/config";

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, config.JWT_SECRET as string);
  } catch (err) {
    console.error("Token verification failed:", err);
    return null;
  }
}
