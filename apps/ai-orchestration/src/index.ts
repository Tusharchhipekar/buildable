import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config/config";
import agentRouter from "./router/agent.routes";
import { authMiddleware } from "./middleware/auth.middleware";

export const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/status/health", (req, res) => {
  res.status(200).json({
    message: "Hello from ai orchestration",
    status: "ok",
  });
});

app.use("/api/ai/agent", authMiddleware, agentRouter);

app.listen(config.AI_PORT, () => {
  console.log(
    `AI Orchestration is running on port http://localhost:${config.AI_PORT}`,
  );
});
