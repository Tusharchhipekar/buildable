import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { config } from "./config/config";
import sandboxRouter from "./routes/sandbox.route";
export const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/sandbox/health", (req, res) => {
  res.status(200).json({
    message: "Sandbox API is healthy",
    status: "OK",
  });
});

app.use("/api/sandbox", sandboxRouter);

app.listen(config.SANDBOX_PORT, () => {
  console.log(`Server is running on http://localhost:${config.SANDBOX_PORT}`);
});
