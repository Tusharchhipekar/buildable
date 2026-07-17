import express from "express";
import type { Request, Response } from "express";
import morgan from "morgan";
import channel from "./mq.js";
import { sendEmail } from "./email.js";
import { config } from "./config/config.js";

export const app = express();
app.use(express.json());
app.use(morgan("dev"));

app.get("/status/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.get("/status/ready", (req: Request, res: Response) => {
  res.status(200).json({ status: "ready" });
});

app.get("/", (req: Request, res: Response) => {
  res.send("notification server is running");
});

interface AuthNotificationMessage {
  userId: string;
  timestamp: string;
  email: string;
}

// consume auth notification
channel.consume("auth_notification_queue", async (msg) => {
  if (msg === null) {
    console.log("Received null message");
    return;
  }

  const messageContent = msg.content.toString();
  console.log("Received message from queue:", messageContent);

  try {
    const { userId, timestamp, email }: AuthNotificationMessage =
      JSON.parse(messageContent);

    const subject = "New Login Notification";
    const text = `A new login was detected for your account at ${timestamp}. If this was not you, please secure your account immediately.`;
    const html = `<p>A new login was detected for your account at <strong>${timestamp}</strong>. If this was not you, please secure your account immediately.</p>`;

    await sendEmail({ to: email, subject, text, html });

    channel.ack(msg);
  } catch (error) {
    console.error("Error processing message:", error);
    // Optionally, you can choose to nack the message to requeue it
    // channel.nack(msg);
  }
});

app.listen(config.NOTIFICATION_PORT, () => {
  console.log(
    `Notification server is running on port http://localhost:${config.NOTIFICATION_PORT}`,
  );
});
