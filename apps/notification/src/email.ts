import nodemailer from "nodemailer";
import type { SentMessageInfo } from "nodemailer";
import { config } from "./config/config";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: config.EMAIL_USER,
    clientId: config.GOOGLE_CLIENT_ID,
    clientSecret: config.GOOGLE_CLIENT_SECRET,
    refreshToken: config.GOOGLE_REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages:", success);
  }
});

type SendEmailParams = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

// Function to send email
export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailParams): Promise<SentMessageInfo | null> => {
  try {
    const info = await transporter.sendMail({
      from: `"Your Name" <${config.EMAIL_USER}>`, // sender address
      to,
      subject,
      text,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    return null;
  }
};
