// src/features/auth/components/LoginForm.tsx
// Versi lengkap — replace file yang sudah ada

import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { login } from "@/features/auth/auth.api";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import PasswordField from "@/components/fields/PasswordField";
import ShortTextField from "@/components/fields/ShortTextField";
import { loginSchema, type LoginFormValues } from "@/schemas/auth.schema";
import OAuthDivider from "./OAuthDivider";
import OAuthButtonGroup from "./OAuthButtonGroup";

export default function LoginForm() {
  const navigate = useNavigate();
  const redirectTo = new URLSearchParams(window.location.search).get("redirectTo") || "/";

  // Tampilkan error OAuth dari query param kalau ada
  // Backend redirect ke /login?error=oauth_failed atau /login?error=oauth_cancelled
  const oauthError = new URLSearchParams(window.location.search).get("error");
  const oauthErrorMessages: Record<string, string> = {
    oauth_failed: "Login dengan provider gagal. Silakan coba lagi.",
    oauth_cancelled: "Login dibatalkan.",
  };

  const [serverError, setServerError] = useState<ResponseError | null>(oauthError ? { message: oauthErrorMessages[oauthError] ?? "Terjadi kesalahan.", success: false, status: 400, code: oauthError } : null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const result = await login(values);
      navigate(redirectTo || "/", { replace: true });
      toast.success(result?.message);
    } catch (err) {
      const res = err as ResponseError;
      setServerError({
        message: res?.message ?? "Login failed, please try again",
        errors: res?.errors,
      });
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 border p-6 rounded-lg">
      {/* Header */}
      <div className="space-y-1 text-center">
        <div>❤️</div>
        <h1 className="text-2xl font-semibold">Login to Pixel.</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Please enter your details.</p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />

      {/* Email / Password form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ShortTextField control={control} name="email" label="Email" type="email" placeholder="example@email.com" autoComplete="email" />
        <PasswordField control={control} name="password" label="Password" placeholder="••••••••" autoComplete="current-password" />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-muted-foreground underline underline-offset-4">
            Forgot Password?
          </Link>
        </div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </Button>
      </form>

      {/* OAuth section */}
      <OAuthDivider />
      <OAuthButtonGroup disabled={isSubmitting} />

      {/* Register link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="underline underline-offset-4">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
