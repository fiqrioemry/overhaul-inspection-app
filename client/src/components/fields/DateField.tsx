import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

type DateFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  min?: string; // "2000-01-01"
  max?: string;
};

export default function DateField<T extends FieldValues>({ control, name, label, description, min, max }: DateFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <Input id={name} type="date" min={min} max={max} {...field} />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  );
}
