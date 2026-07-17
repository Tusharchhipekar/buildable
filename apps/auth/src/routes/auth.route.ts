import { Router } from "express";
import passport from "passport";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendAuthNotification } from "../config/mq.js";
import { config } from "../config/config.js";
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

const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true, // JS can't read it — XSS protection
  secure: true, // only sent over HTTPS
  sameSite: "none", // allow cross-site (iframes, different subdomains)
  domain: ".cryboy.in", // works across all *.cryboy.in subdomains
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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
      });
    } catch (err) {
      console.error("Error during login:", err);
      res.status(500).json({ error: "Login failed" });
    }
  },
);

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

      //   await sendAuthNotification({
      //     userId: user._id,
      //     action: "google_login",
      //     timestamp: new Date(),
      //     email: emails?.[0]?.value,
      //   });

      const token = signToken(user._id.toString());
      res.cookie("token", token, COOKIE_OPTIONS);

      res.redirect("https://www.cryboy.in");
    } catch (err) {
      console.error("Error during Google authentication:", err);
      res.redirect("/");
    }
  },
);
