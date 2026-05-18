import React from "react";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface NotificationSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function NotificationSearch({ value, onChange, className }: NotificationSearchProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" size={16} />
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search notifications..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-9 pr-9 h-10 bg-muted/50 border-transparent focus-visible:border-border focus-visible:bg-background transition-colors"
      />
      {value && (
        <button onClick={handleClear} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
          <X size={14} />
        </button>
      )}
    </div>
  );
}
