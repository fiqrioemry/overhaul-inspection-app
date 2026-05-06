import * as nodemailer from "nodemailer";
import constant from "@/config/constant";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: constant.SMTP_USER,
    pass: constant.SMTP_PASS,
  },
});
