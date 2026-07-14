import express from "express";
import morgan from "morgan";
import fs from "fs";
import { config } from "./config/config";
const WORKSPACE_DIR = "/workspace";
export const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    message: "Hello from sandbox agent",
    status: "ok",
  });
});

app.get("/list-files", async (req, res) => {
  const elements = await fs.promises.readdir(WORKSPACE_DIR);

  res.status(200).json({
    message: "Elements of working directory",
    elements,
  });
});

app.listen(config.AGENT_PORT, () => {
  console.log(`Agent is running on port http://localhost:${config.AGENT_PORT}`);
});
