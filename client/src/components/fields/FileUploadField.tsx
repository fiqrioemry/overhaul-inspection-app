import { useRef } from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";

type FileUploadFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  accept?: string;
  description?: string;
};

export default function FileUploadField<T extends FieldValues>({ control, name, label, accept = "image/*", description }: FileUploadFieldProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const file = field.value as File | null;

        return (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}

            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
                {file ? "Ganti File" : "Pilih File"}
              </Button>
              {file && <span className="text-sm text-muted-foreground truncate max-w-50">{file.name}</span>}
            </div>

            {/* preview kalau image */}
            {file && file.type.startsWith("image/") && <img src={URL.createObjectURL(file)} alt="preview" className="mt-2 h-24 w-24 rounded-md object-cover" />}

            <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={(e) => field.onChange(e.target.files?.[0] ?? null)} />

            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
