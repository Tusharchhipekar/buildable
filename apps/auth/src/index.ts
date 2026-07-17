import express from "express";
import morgan from "morgan";
import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
} from "passport-google-oauth20";
import cookieParser from "cookie-parser";
import { config } from "./config/config"; // adjust to wherever GOOGLE_CLIENT_ID/SECRET live
import { authRouter } from "./routes/auth.route";
import cors from "cors";

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use(passport.initialize());

if (!config.GOOGLE_CLIENT_ID || !config.GOOGLE_CLIENT_SECRET) {
  throw new Error(
    "Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in environment",
  );
}

passport.use(
  new GoogleStrategy(
    {
      clientID: config.GOOGLE_CLIENT_ID,
      clientSecret: config.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    (
      _accessToken: string,
      _refreshToken: string,
      profile: Profile,
      done: VerifyCallback,
    ) => {
      done(null, profile);
    },
  ),
);

app.get("/_status/health", (req, res) => {
  res.status(200).json({ status: "ok", service: "auth" });
});

app.get("/_status/ready", (req, res) => {
  res.status(200).json({ status: "ready", service: "auth" });
});

app.use("/api/auth", authRouter);

app.listen(config.AUTH_PORT, () => {
  console.log(
    `Auth server running on port http://localhost:${config.AUTH_PORT}`,
  );
});
