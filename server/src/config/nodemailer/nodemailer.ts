import * as nodemailer from "nodemailer";
import mailer from "../constant/email";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: mailer.smtpUser,
    pass: mailer.smtpPass,
  },
});
