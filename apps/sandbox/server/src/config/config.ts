import dotenv from "dotenv";
dotenv.config();

if (!process.env.SANDBOX_PORT) {
  throw new Error("SANDBOX_PORT is not defined");
} else if (!process.env.SANDBOX_MONGO_URL) {
  throw new Error("SANDBOX_MONGO_URL is not defined");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not defined");
}

export const config = {
  SANDBOX_PORT: process.env.SANDBOX_PORT,
  SANDBOX_MONGO_URL: process.env.SANDBOX_MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  REDIS_URL: process.env.REDIS_URL,
};
