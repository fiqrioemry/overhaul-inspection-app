import React from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { MailCheck, ArrowLeft } from "lucide-react";
import { ShortTextField } from "@/components/fields";
import AlertCard from "@/components/common/AlertCard";
import { forgotPassword } from "@/features/auth/auth.api";
import type { ResponseError } from "@/types/response.type";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/schemas/auth.schema";

export default function ForgotPasswordForm() {
  const [success, setSuccess] = React.useState<string | null>(null);
  const [serverError, setServerError] = React.useState<ResponseError | null>(null);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null);

    try {
      const result = await forgotPassword(values);
      setSuccess(result.message);
      toast.success(result?.message || "Password reset instructions sent successfully.");
    } catch (err) {
      const res = err as ResponseError;
      setServerError({
        message: res?.message ?? "Password reset failed, please try again",
        errors: res?.errors,
      });
    }
  }

  // Success State
  if (success) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="rounded-2xl border bg-background p-8 shadow-sm text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400">
            <MailCheck className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Check Your Email</h1>
            <p className="text-sm text-muted-foreground leading-6">We’ve sent password reset instructions to:</p>
            <p className="font-medium text-foreground break-all">{getValues("email")}</p>
          </div>

          <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground text-left leading-6">If you don’t see the email within a few minutes, check your spam or junk folder.</div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/login">Back to Sign In</Link>
            </Button>

            <Button type="button" variant="ghost" className="w-full" onClick={() => setSuccess(null)}>
              Resend Email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Default Form State
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Forgot Password</h1>
        <p className="text-sm text-muted-foreground">Enter your email to receive password reset instructions.</p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ShortTextField control={control} name="email" label="Email" type="email" placeholder="kamu@email.com" autoComplete="email" />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Reset Instructions"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Remember your account?{" "}
          <Link to="/login" className="inline-flex items-center gap-1 underline underline-offset-4">
            <ArrowLeft className="h-3 w-3" />
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
