import { Controller } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

type LongTextFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  description?: string;
  rows?: number;
};

export default function LongTextField<T extends FieldValues>({ control, name, label, placeholder, description, rows = 4 }: LongTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <Textarea id={name} placeholder={placeholder} rows={rows} {...field} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
