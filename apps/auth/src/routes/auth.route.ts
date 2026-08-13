import { Router } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendAuthNotification } from "../config/mq.js";
import { config } from "../config/config.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { userModel } from "@repo/mongodb";
import type { Request, Response, CookieOptions } from "express";
import type { GoogleProfile } from "../types.js";
import type {
  RegisterBody,
  LoginBody,
  AuthResponseBody,
  ErrorResponseBody,
} from "../types.js";

export const authRouter = Router();

// secure + a cross-subdomain `domain` only work together over HTTPS on a
// real domain — browsers silently drop the cookie otherwise, so local/
// compose dev (COOKIE_DOMAIN unset) falls back to relaxed settings scoped
// to whatever host actually served the request.
const COOKIE_OPTIONS: CookieOptions = config.COOKIE_DOMAIN
  ? {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      domain: config.COOKIE_DOMAIN,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    }
  : {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    };

function signToken(userId: string): string {
  return jwt.sign({ id: userId }, config.JWT_SECRET, { expiresIn: "1h" });
}

authRouter.post(
  "/register",
  async (
    req: Request<{}, AuthResponseBody | ErrorResponseBody, RegisterBody>,
    res: Response<AuthResponseBody | ErrorResponseBody>,
  ) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const existing = await userModel.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: "User already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = new userModel({
        email,
        name,
        password: passwordHash,
      });
      await user.save();

      const token = signToken(user._id.toString());
      res.cookie("token", token, COOKIE_OPTIONS);

      res.status(201).json({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      });
    } catch (err) {
      console.error("Error during registration:", err);
      res.status(500).json({ error: "Registration failed" });
    }
  },
);

authRouter.post(
  "/login",
  async (
    req: Request<{}, AuthResponseBody | ErrorResponseBody, LoginBody>,
    res: Response<AuthResponseBody | ErrorResponseBody>,
  ) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res
          .status(400)
          .json({ error: "Email and password are required" });
      }

      const user = await userModel.findOne({ email });
      if (!user || !user.password) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = signToken(user._id.toString());
      res.cookie("token", token, COOKIE_OPTIONS);

      res.status(200).json({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ error: "Login failed" });
    }
  },
);

const DEMO_EMAIL = "demo@buildable.dev";

authRouter.post(
  "/demo",
  async (
    req: Request,
    res: Response<AuthResponseBody | ErrorResponseBody>,
  ) => {
    try {
      let user = await userModel.findOne({ email: DEMO_EMAIL });
      if (!user) {
        user = new userModel({
          email: DEMO_EMAIL,
          name: "Demo User",
        });
        await user.save();
      }

      const token = signToken(user._id.toString());
      res.cookie("token", token, COOKIE_OPTIONS);

      res.status(200).json({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      });
    } catch (err) {
      console.error("Error during demo login:", err);
      res.status(500).json({ error: "Demo login failed" });
    }
  },
);

authRouter.get(
  "/me",
  authMiddleware,
  async (
    req: Request,
    res: Response<AuthResponseBody | ErrorResponseBody>,
  ) => {
    try {
      const userId = (req as any).user.id;
      const user = await userModel.findById(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.status(200).json({
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      });
    } catch (err) {
      console.error("Error fetching current user:", err);
      res.status(500).json({ error: "Failed to fetch current user" });
    }
  },
);

authRouter.post("/logout", (req: Request, res: Response) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.status(200).json({ ok: true });
});

authRouter.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  }),
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/",
  }),
  async (req: Request, res: Response) => {
    try {
      const { id, displayName, emails, photos } = req.user as GoogleProfile;
      let user = await userModel.findOne({ googleId: id });

      if (!user) {
        user = new userModel({
          googleId: id,
          email: emails?.[0]?.value,
          name: displayName,
          avatar: photos?.[0]?.value,
        });
        await user.save();
      }

      await sendAuthNotification({
        userId: user._id,
        action: "google_login",
        timestamp: new Date(),
        email: emails?.[0]?.value,
      });

      const token = signToken(user._id.toString());
      res.cookie("token", token, COOKIE_OPTIONS);

      res.redirect(config.FRONTEND_URL);
    } catch (err) {
      console.error("Error during Google authentication:", err);
      res.redirect("/");
    }
  },
);
