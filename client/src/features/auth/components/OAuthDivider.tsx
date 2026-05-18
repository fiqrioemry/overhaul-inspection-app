// src/features/auth/components/OAuthDivider.tsx

interface OAuthDividerProps {
  label?: string;
}

export default function OAuthDivider({ label = "Or Continue With" }: OAuthDividerProps) {
  return (
    <div className="relative flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
