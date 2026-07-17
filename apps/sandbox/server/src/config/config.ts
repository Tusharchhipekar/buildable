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

if (!process.env.AWS_REGION) {
  throw new Error("AWS_REGION is not defined");
}

if (!process.env.AWS_ACCESS_KEY_ID) {
  throw new Error("AWS_ACCESS_KEY_ID is not defined");
}

if (!process.env.AWS_SECRET_ACCESS_KEY) {
  throw new Error("AWS_SECRET_ACCESS_KEY is not defined");
}

export const config = {
  SANDBOX_PORT: process.env.SANDBOX_PORT,
  SANDBOX_MONGO_URL: process.env.SANDBOX_MONGO_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  REDIS_URL: process.env.REDIS_URL,
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};
