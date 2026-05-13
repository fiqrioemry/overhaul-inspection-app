import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

type PhoneFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  placeholder?: string;
  description?: string;
};

export default function PhoneField<T extends FieldValues>({ control, name, label = "Nomor Telepon", placeholder = "08xxxxxxxxxx", description }: PhoneFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <Input id={name} type="tel" inputMode="numeric" placeholder={placeholder} autoComplete="tel" {...field} onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ""))} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
