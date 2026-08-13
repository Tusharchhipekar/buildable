import "dotenv/config";

if (!process.env.AI_PORT) {
  throw new Error("AI_PORT is not defined");
}

if (!process.env.MISTRAL_API_KEY) {
  throw new Error("MISTRAL_API_KEY is not defined");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined");
}

if (!process.env.MONGO_URL) {
  throw new Error("MONGO_URL is not defined");
}

export const config = {
  AI_PORT: parseInt(process.env.AI_PORT),

  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,

  JWT_SECRET: process.env.JWT_SECRET,

  MONGO_URL: process.env.MONGO_URL,
};
