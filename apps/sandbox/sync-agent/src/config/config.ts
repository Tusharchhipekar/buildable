import dotenv from "dotenv";
dotenv.config();

if (!process.env.AWS_REGION) throw new Error("AWS_REGION is not defined");
if (!process.env.AWS_ACCESS_KEY_ID)
  throw new Error("AWS_ACCESS_KEY_ID is not defined");
if (!process.env.AWS_SECRET_ACCESS_KEY)
  throw new Error("AWS_SECRET_ACCESS_KEY is not defined");

export const config = {
  AWS_REGION: process.env.AWS_REGION,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
};
