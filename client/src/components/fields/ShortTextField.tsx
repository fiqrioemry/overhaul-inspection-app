import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { Control, FieldValues, Path } from "react-hook-form";
import type { InputHTMLAttributes } from "react";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

type ShortTextFieldProps<T extends FieldValues> = Omit<InputHTMLAttributes<HTMLInputElement>, "name" | "type" | "value" | "onChange" | "defaultValue"> & {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  type?: "text" | "email" | "password" | "tel" | "number";
  autoComplete?: string;
};

export default function ShortTextField<T extends FieldValues>({ control, name, label, placeholder, description, type = "text", autoComplete, ...inputProps }: ShortTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>

          {description && <FieldDescription>{description}</FieldDescription>}

          <Input
            id={name}
            type={type}
            placeholder={placeholder}
            autoComplete={autoComplete}
            {...inputProps}
            {...field}
            value={field.value ?? ""}
            onChange={(event) => {
              if (type === "number") {
                field.onChange(event.target.value === "" ? undefined : Number(event.target.value));
                return;
              }

              field.onChange(event);
            }}
          />

          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
