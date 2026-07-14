import dotenv from "dotenv";
dotenv.config();

if (!process.env.AGENT_PORT) {
  throw new Error("AGENT_PORT is not defined");
}

export const config = {
  AGENT_PORT: Number(process.env.AGENT_PORT),
};
