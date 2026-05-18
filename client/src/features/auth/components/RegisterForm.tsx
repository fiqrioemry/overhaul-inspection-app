import { toast } from "sonner";
import { useState } from "react";
import { register } from "../auth.api";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import AlertCard from "@/components/common/AlertCard";
import type { ResponseError } from "@/types/response.type";
import ShortTextField from "@/components/fields/ShortTextField";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth.schema";
import PasswordField from "@/components/fields/PasswordField";

export default function RegisterForm() {
  const [success, setSuccess] = useState<string | null>(null);
  const [serverError, setServerError] = useState<ResponseError | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      const result = await register(values);
      setSuccess(result?.message);
      toast.success(result?.message || "Registration successful!");
    } catch (err) {
      const res = err as ResponseError;
      setServerError({
        message: res?.message ?? "Registration failed, please try again",
        errors: res?.errors,
      });
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-6">
        <div className="rounded-2xl border bg-background p-8 shadow-sm text-center space-y-6">
          <CheckCircle2 size={40} className="mx-auto text-green-500" />
          <p className="text-sm text-muted-foreground leading-6">Verification link has been sent to your email. Please check your inbox and follow the instructions.</p>
          <Button asChild className="w-full">
            <Link to="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold">Create Your Account</h1>
      </div>

      <AlertCard message={serverError?.message} errors={serverError?.errors} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <ShortTextField control={control} name="name" label="Fullname" placeholder="john doe" autoComplete="name" />
        <ShortTextField control={control} name="email" label="Email" type="email" placeholder="kamu@email.com" autoComplete="email" />
        <PasswordField control={control} name="password" label="Password" placeholder="••••••••" autoComplete="new-password" />
        <PasswordField control={control} name="confirmPassword" label="Confirm Password" placeholder="••••••••" autoComplete="new-password" />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Registering..." : "Register"}
        </Button>
      </form>

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
