import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

type PasswordFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  autoComplete?: string;
};

export default function PasswordField<T extends FieldValues>({ control, name, label, placeholder, description, autoComplete = "current-password" }: PasswordFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>

          {description && <FieldDescription>{description}</FieldDescription>}

          <div className="relative">
            <Input id={name} type={showPassword ? "text" : "password"} placeholder={placeholder} autoComplete={autoComplete} className="pr-10" {...field} />

            <Button type="button" variant="ghost" size="icon" tabIndex={-1} onClick={() => setShowPassword((prev) => !prev)} className="absolute top-1/2 right-1 h-8 w-8 -translate-y-1/2">
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}

              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </Button>
          </div>

          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
