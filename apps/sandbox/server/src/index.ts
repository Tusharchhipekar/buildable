import express from "express";
import morgan from "morgan";
import { config } from "./config/config";
import { createPod } from "./kubernetes/pod.js";
import { createService } from "./kubernetes/service.js";
import { v7 as uuid } from "uuid";
export const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/sandbox/health", (req, res) => {
  res.status(200).json({
    message: "Sandbox API is healthy",
    status: "OK",
  });
});

app.listen(config.SANDBOX_PORT, () => {
  console.log(`Server is running on http://localhost:${config.SANDBOX_PORT}`);
});
