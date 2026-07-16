import { Router } from "express";
import passport from "passport";
import { sendAuthNotification } from "../config/mq.js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { userModel } from "@repo/mongodb";
import type { Request, Response } from "express";
import type { GoogleProfile } from "../types.js";
export const authRouter = Router();

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

      // Generate JWT token
      const token = jwt.sign({ id: user._id }, config.JWT_SECRET, {
        expiresIn: "1h",
      });

      // Set token in cookie
      res.cookie("token", token, {
        httpOnly: true, // JS can't read it — XSS protection
        secure: true, // only sent over HTTPS
        sameSite: "none", // allow cross-site (iframes, different subdomains)
        domain: ".cryboy.in", // works across all *.cryboy.in subdomains
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      res.redirect("https://www.cryboy.in"); // Redirect to your frontend after successful login
    } catch (err) {
      console.error("Error during Google authentication:", err);
      res.redirect("/"); // Redirect to your frontend on error
    }
  },
);
