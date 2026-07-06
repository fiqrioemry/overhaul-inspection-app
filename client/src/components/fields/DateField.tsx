import { useState } from "react";
import { Controller } from "react-hook-form";
import { format, isValid, parse } from "date-fns";
import { CalendarIcon, ChevronDownIcon, XIcon } from "lucide-react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Field, FieldLabel, FieldError, FieldDescription } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type DateFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  placeholder?: string;
  min?: string; // "2000-01-01"
  max?: string;
  /** Show a clear (×) action when a date is selected. Default false. */
  clearable?: boolean;
};

function parseIso(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : undefined;
}

export default function DateField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder = "Select date...",
  min,
  max,
  clearable = false,
}: DateFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const minDate = parseIso(min);
  const maxDate = parseIso(max);
  const todayIso = format(new Date(), "yyyy-MM-dd");
  const todayDisabled = (!!min && todayIso < min) || (!!max && todayIso > max);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = parseIso(field.value);

        return (
          <Field data-invalid={!!fieldState.error}>
            <FieldLabel htmlFor={name}>{label}</FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}

            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  id={name}
                  variant="outline"
                  aria-invalid={!!fieldState.error}
                  className={cn("w-full justify-between px-3 font-normal", !selected && "text-muted-foreground")}
                >
                  <span className="flex items-center gap-2 truncate">
                    <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
                    {selected ? format(selected, "EEE, dd MMM yyyy") : placeholder}
                  </span>
                  <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
                </Button>
              </PopoverTrigger>

              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  selected={selected}
                  defaultMonth={selected}
                  startMonth={minDate ?? new Date(new Date().getFullYear() - 10, 0)}
                  endMonth={maxDate ?? new Date(new Date().getFullYear() + 5, 11)}
                  disabled={[...(minDate ? [{ before: minDate }] : []), ...(maxDate ? [{ after: maxDate }] : [])]}
                  onSelect={(date) => {
                    field.onChange(date ? format(date, "yyyy-MM-dd") : "");
                    setOpen(false);
                  }}
                />

                <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    className="text-muted-foreground"
                    disabled={todayDisabled}
                    onClick={() => {
                      field.onChange(todayIso);
                      setOpen(false);
                    }}
                  >
                    Today
                  </Button>

                  {clearable && selected && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="text-muted-foreground"
                      onClick={() => {
                        field.onChange("");
                        setOpen(false);
                      }}
                    >
                      <XIcon className="size-3" /> Clear
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <FieldError errors={[fieldState.error]} />
          </Field>
        );
      }}
    />
  );
}
