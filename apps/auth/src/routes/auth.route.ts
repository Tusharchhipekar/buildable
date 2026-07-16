import { Router } from "express";
import passport from "passport";
import { sendAuthNotification } from "../config/mq.js";
import jwt from "jsonwebtoken";

export const authRouter = Router();

authRouter.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  }),
);
