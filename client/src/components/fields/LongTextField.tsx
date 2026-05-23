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
  maxLength?: number;
  className?: string;
};

export default function LongTextField<T extends FieldValues>({ control, name, label, className, placeholder, description, rows = 4, maxLength }: LongTextFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          <Textarea id={name} placeholder={placeholder} rows={rows} maxLength={maxLength} className={className} {...field} />
          <div className="flex items-start justify-between gap-2">
            <FieldError errors={[fieldState.error]} />
            {maxLength && (
              <span className={`text-xs shrink-0 ml-auto tabular-nums ${(field.value?.length ?? 0) >= maxLength ? "text-destructive" : "text-muted-foreground"}`}>
                {field.value?.length ?? 0} / {maxLength}
              </span>
            )}
          </div>
        </Field>
      )}
    />
  );
}
