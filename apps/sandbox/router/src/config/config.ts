import dotenv from "dotenv";
dotenv.config();

if (!process.env.ROUTER_PORT) throw new Error("ROUTER_PORT is not defined");

export const config = {
  ROUTER_PORT: process.env.ROUTER_PORT,
};
