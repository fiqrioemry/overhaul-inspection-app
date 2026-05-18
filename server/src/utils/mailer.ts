import { transporter } from "@/lib/nodemailer";
import { verificationEmailTemplate, resetPasswordTemplate, newAccountPasswordTemplate } from "@/utils/email-template";

// Send Verification Email
export function sendVerificationLink({ to, subject, url }: { to: string; subject: string; url: string }) {
  transporter.sendMail({
    to,
    subject,
    html: verificationEmailTemplate(url),
  });
}

// Send Reset Password Email
export function sendResetLink({ to, subject, url }: { to: string; subject: string; url: string }) {
  transporter.sendMail({
    to,
    subject,
    html: resetPasswordTemplate(url),
  });
}

export function sendNewAccountPassword({ to, subject, password }: { to: string; subject: string; password: string }) {
  transporter.sendMail({
    to,
    subject,
    html: newAccountPasswordTemplate(password),
  });
}
