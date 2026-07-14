import express from "express";
import morgan from "morgan";
import { config } from "./config/config";

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

app.listen(config.SERVER_PORT, () => {
  console.log(`Server is running on http://localhost:${config.SERVER_PORT}`);
});
