// src/components/fields/DateRangeFilter.tsx
import { useState } from "react";
import { format, isValid, parse } from "date-fns";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DateRangeFilterProps = {
  /** ISO date string "yyyy-MM-dd" or "" when unset. */
  startDate: string;
  endDate: string;
  onChange: (startDate: string, endDate: string) => void;
  placeholder?: string;
  className?: string;
};

function parseIso(value?: string): Date | undefined {
  if (!value) return undefined;
  const date = parse(value, "yyyy-MM-dd", new Date());
  return isValid(date) ? date : undefined;
}

export default function DateRangeFilter({ startDate, endDate, onChange, placeholder = "Date range", className }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  // react-day-picker reports {from, to} both set on the FIRST click of a range,
  // so "to is set" can't be used to detect completion — track it ourselves.
  const [selecting, setSelecting] = useState(false);
  const from = parseIso(startDate);
  const to = parseIso(endDate);
  const selected: DateRange | undefined = from || to ? { from: from ?? to, to } : undefined;

  const label =
    from && to
      ? `${format(from, "dd MMM yyyy")} — ${format(to, "dd MMM yyyy")}`
      : from
        ? `${format(from, "dd MMM yyyy")} — …`
        : placeholder;

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSelecting(false);
      }}
    >
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className={cn("justify-between px-3 font-normal", !from && !to && "text-muted-foreground", className)}>
          <span className="flex items-center gap-2 truncate">
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            {label}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          captionLayout="dropdown"
          selected={selected}
          defaultMonth={from ?? to}
          startMonth={new Date(new Date().getFullYear() - 10, 0)}
          endMonth={new Date(new Date().getFullYear() + 5, 11)}
          onSelect={(range) => {
            if (!range?.from) {
              onChange("", "");
              setSelecting(false);
              return;
            }
            if (!selecting) {
              // First click: start a new range (ignore the auto-filled `to`).
              onChange(format(range.from, "yyyy-MM-dd"), "");
              setSelecting(true);
              return;
            }
            onChange(format(range.from, "yyyy-MM-dd"), range.to ? format(range.to, "yyyy-MM-dd") : "");
            setSelecting(false);
            setOpen(false);
          }}
        />

        <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
          <span className="text-xs text-muted-foreground">{from && !to ? "Pick an end date" : "Pick a start date"}</span>
          {(from || to) && (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              className="text-muted-foreground"
              onClick={() => {
                onChange("", "");
                setSelecting(false);
                setOpen(false);
              }}
            >
              <XIcon className="size-3" /> Clear
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
