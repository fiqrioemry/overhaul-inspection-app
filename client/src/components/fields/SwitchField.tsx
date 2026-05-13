import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Field, FieldDescription } from "@/components/ui/field";
import type { Control, FieldValues, Path } from "react-hook-form";

type SwitchFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
};

export default function SwitchField<T extends FieldValues>({ control, name, label, description }: SwitchFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Field orientation="horizontal">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor={name}>{label}</Label>
            {description && <FieldDescription>{description}</FieldDescription>}
          </div>
          <Switch id={name} checked={field.value} onCheckedChange={field.onChange} />
        </Field>
      )}
    />
  );
}
