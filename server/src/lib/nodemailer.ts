import * as nodemailer from "nodemailer";
import { mailConfig } from "@/config/env";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: mailConfig.SMTP_USER,
    pass: mailConfig.SMTP_PASS,
  },
});
