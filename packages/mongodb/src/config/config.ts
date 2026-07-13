import dotenv from "dotenv";
dotenv.config();

if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL is not defined");
}

export const config = {
  MONGO_URL: process.env.MONGO_URL,
};
