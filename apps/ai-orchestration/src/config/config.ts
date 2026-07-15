import dotenv from "dotenv";
import "dotenv/config";

if (!process.env.AI_PORT) {
  throw new Error("AI_PORT is not defined");
}

if (!process.env.MISTRAL_API_KEY) {
  throw new Error("MISTRAL_API_KEY is not defined");
}

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error("ANTHROPIC_API_KEY is not defined");
}

export const config = {
  AI_PORT: parseInt(process.env.AI_PORT || "8082"),
  MISTRAL_API_KEY: process.env.MISTRAL_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};
