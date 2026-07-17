import dotenv from "dotenv";
dotenv.config();

if (!process.env.ROUTER_PORT) throw new Error("ROUTER_PORT is not defined");

if (!process.env.REDIS_URL) throw new Error("REDIS_URL is not defined");

export const config = {
  ROUTER_PORT: process.env.ROUTER_PORT,
  REDIS_URL: process.env.REDIS_URL,
};
