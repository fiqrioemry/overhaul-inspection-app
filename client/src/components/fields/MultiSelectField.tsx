import { Controller } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

type SelectOption = { label: string; value: string };

type MultiSelectFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  description?: string;
};

export default function MultiSelectField<T extends FieldValues>({ control, name, label, options, description }: MultiSelectFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected: string[] = field.value ?? [];

        function toggle(value: string) {
          const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
          field.onChange(next);
        }

        return (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}

            {/* selected badges */}
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selected?.map((val) => {
                  const opt = options.find((o) => o.value === val);
                  return (
                    <Badge key={val} variant="secondary" className="cursor-pointer" onClick={() => toggle(val)}>
                      {opt?.label} ✕
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* checkbox list */}
            <div className="flex flex-col gap-2 rounded-md border p-3">
              {options.map((opt) => (
                <label key={opt.value} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={selected.includes(opt.value)} onCheckedChange={() => toggle(opt.value)} />
                  {opt.label}
                </label>
              ))}
            </div>

            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
