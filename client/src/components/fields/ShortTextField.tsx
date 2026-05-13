import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

type ShortTextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "email" | "password" | "tel";
  autoComplete?: string;
};

export default function ShortTextField<T extends FieldValues>({ control, name, label, placeholder, description, type = "text", autoComplete }: ShortTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <Input id={name} type={type} placeholder={placeholder} autoComplete={autoComplete} {...field} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
