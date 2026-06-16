// src/features/auth/components/LoginForm.tsx
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
import { ROUTES } from "@/constants/route.constant";

export default function LoginForm() {
  const navigate = useNavigate();
  const redirectTo = new URLSearchParams(window.location.search).get("redirectTo") || ROUTES.DASHBOARD;
  const [serverError, setServerError] = useState<ResponseError | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema()),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
      toast.success("Login berhasil");
    } catch (err) {
      const res = err as ResponseError;
      setServerError({ message: res?.message ?? "Email atau password tidak valid", errors: res?.errors });
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-0.5">
        <h2 className="text-base font-semibold text-slate-800">Masuk</h2>
        <p className="text-xs text-slate-500">Gunakan akun yang telah didaftarkan oleh administrator</p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ShortTextField
          control={control}
          name="email"
          label="Email"
          type="email"
          placeholder="nama@sucofindo.co.id"
          autoComplete="email"
        />
        <div className="space-y-1">
          <PasswordField
            control={control}
            name="password"
            label="Password"
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <div className="flex justify-end">
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-4"
            >
              Lupa password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    </div>
  );
}
