// src/features/auth/components/RegisterForm.tsx
// Versi lengkap — replace file yang sudah ada
// Tambahkan OAuth buttons di bawah form register juga,
// supaya user bisa register sekaligus lewat Google/GitHub

import { toast } from "sonner";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { register } from "@/features/auth/auth.api";
import { Link, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import PasswordField from "@/components/fields/PasswordField";
import ShortTextField from "@/components/fields/ShortTextField";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth.schema";
import OAuthDivider from "./OAuthDivider";
import OAuthButtonGroup from "./OAuthButtonGroup";

export default function RegisterForm() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<ResponseError | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      const result = await register(values);
      toast.success(result?.message || "Registrasi berhasil! Cek email kamu untuk verifikasi.");
      navigate("/login", { replace: true });
    } catch (err) {
      const res = err as ResponseError;
      setServerError({
        message: res?.message ?? "Registration failed, please try again",
        errors: res?.errors,
      });
    }
  }

  return (
    <div className="w-full max-w-sm space-y-6 border p-6 rounded-lg">
      {/* Header */}
      <div className="space-y-1 text-center">
        <div>✨</div>
        <h1 className="text-2xl font-semibold">Create an account</h1>
        <p className="text-sm text-muted-foreground">Join Pixel and start sharing moments.</p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />

      {/* Register form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ShortTextField control={control} name="name" label="Full Name" placeholder="Nama kamu" autoComplete="name" />
        <ShortTextField control={control} name="email" label="Email" type="email" placeholder="example@email.com" autoComplete="email" />
        <PasswordField control={control} name="password" label="Password" placeholder="••••••••" autoComplete="new-password" />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      {/* OAuth section */}
      <OAuthDivider label="Or Register With" />
      <OAuthButtonGroup disabled={isSubmitting} />

      {/* Login link */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
