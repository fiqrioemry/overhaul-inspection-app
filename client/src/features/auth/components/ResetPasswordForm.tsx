import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import { useResetPassword } from "@/features/auth/auth.query";
import PasswordField from "@/components/fields/PasswordField";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/schemas/auth.schema";

interface ResetPasswordFormProps {
  token: string;
}

export default function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [success, setSuccess] = React.useState(false);
  const [serverError, setServerError] = React.useState<ResponseError | null>(null);

  const mutation = useResetPassword(token);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema()),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);

    try {
      await mutation.mutateAsync(values);
      setSuccess(true);
    } catch (err) {
      const res = err as ResponseError;
      setServerError({
        message: res?.message ?? "Failed to reset password, please try again.",
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
            <ShieldCheck className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Password Reset Successfully</h1>
            <p className="text-sm text-muted-foreground leading-6">Your Password has been successfully updated. Please login with your new password.</p>
          </div>

          <Button asChild className="w-full">
            <Link to="/login">Login Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Invalid / Missing Token State
  if (!token) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="rounded-2xl border bg-background p-8 shadow-sm text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldCheck className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Invalid Link</h1>
            <p className="text-sm text-muted-foreground leading-6">The password reset link is invalid or has expired. Please request a new link.</p>
          </div>

          <Button asChild className="w-full">
            <Link to="/forgot-password">Request New Link</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Default Form State
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Create New Password</h1>
        <p className="text-sm text-muted-foreground">Enter your new password below.</p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField control={control} name="password" label="New Password" placeholder="At least 8 characters" autoComplete="new-password" />

        <PasswordField control={control} name="confirmPassword" label="Confirm Password" placeholder="Repeat new password" autoComplete="new-password" />

        <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
          {isSubmitting || mutation.isPending ? "Saving..." : "Save New Password"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="underline underline-offset-4">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
