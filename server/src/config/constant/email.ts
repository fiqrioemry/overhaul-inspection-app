const mailer = {
  smtpUser: process.env.SMTP_USER || "user@example.com",
  smtpPass: process.env.SMTP_PASS || "password",
  emailVerificationSubject: "Verify your email address",
  passwordResetSubject: "Reset your password",
};

export default mailer;
