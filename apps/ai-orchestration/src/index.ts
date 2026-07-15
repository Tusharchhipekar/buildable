import express from "express";
import morgan from "morgan";
import { config } from "./config/config";
import agentRouter from "./router/agent.routes";

export const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/status/health", (req, res) => {
  res.status(200).json({
    message: "Hello from ai orchestration",
    status: "ok",
  });
});

app.use("/api/ai/agent", agentRouter);

app.listen(config.AI_PORT, () => {
  console.log(
    `AI Orchestration is running on port http://localhost:${config.AI_PORT}`,
  );
});
