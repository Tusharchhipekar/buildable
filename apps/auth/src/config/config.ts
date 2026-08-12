import dotenv from "dotenv";
dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error("GOOGLE_CLIENT_SECRET is not defined");
}

if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error("GOOGLE_CLIENT_ID is not defined");
}

if (!process.env.RABBITMQ_URL) {
  throw new Error("RABBITMQ_URL is not defined");
}

export const config = {
  JWT_SECRET: process.env.JWT_SECRET,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  AUTH_PORT: process.env.AUTH_PORT,
  RABBITMQ_URL: process.env.RABBITMQ_URL,
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
};
