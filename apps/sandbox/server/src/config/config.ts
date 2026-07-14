import dotenv from "dotenv";
dotenv.config();

export const config = {
  SERVER_PORT: process.env.SERVER_PORT,
  MONGODB_URL: process.env.MONGODB_URL,
};
