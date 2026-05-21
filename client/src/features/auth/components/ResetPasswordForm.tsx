// src/features/auth/components/ResetPasswordForm.tsx

import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

import AlertCard from "@/components/common/AlertCard";
import { useResetPassword } from "@/features/auth/auth.query";
import type { ResponseError } from "@/types/response.type";
import { zodResolver } from "@hookform/resolvers/zod/dist/zod.js";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/schemas/auth.schema";
import PasswordField from "@/components/fields/PasswordField";

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
    resolver: zodResolver(resetPasswordSchema),
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
        message: res?.message ?? "Gagal mereset password, coba lagi.",
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
            <h1 className="text-2xl font-semibold tracking-tight">Password Berhasil Direset</h1>
            <p className="text-sm text-muted-foreground leading-6">Password kamu telah berhasil diperbarui. Silakan masuk menggunakan password baru kamu.</p>
          </div>

          <Button asChild className="w-full">
            <Link to="/login">Masuk Sekarang</Link>
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
            <h1 className="text-2xl font-semibold tracking-tight">Link Tidak Valid</h1>
            <p className="text-sm text-muted-foreground leading-6">Link reset password tidak valid atau sudah kedaluwarsa. Silakan minta link baru.</p>
          </div>

          <Button asChild className="w-full">
            <Link to="/forgot-password">Minta Link Baru</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Default Form State
  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Buat Password Baru</h1>
        <p className="text-sm text-muted-foreground">Masukkan password baru kamu di bawah ini.</p>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <PasswordField control={control} name="password" label="Password Baru" placeholder="Minimal 8 karakter" autoComplete="new-password" />

        <PasswordField control={control} name="confirmPassword" label="Konfirmasi Password" placeholder="Ulangi password baru" autoComplete="new-password" />

        <Button type="submit" className="w-full" disabled={isSubmitting || mutation.isPending}>
          {isSubmitting || mutation.isPending ? "Menyimpan..." : "Simpan Password Baru"}
        </Button>
      </form>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Ingat password kamu?{" "}
          <Link to="/login" className="underline underline-offset-4">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
