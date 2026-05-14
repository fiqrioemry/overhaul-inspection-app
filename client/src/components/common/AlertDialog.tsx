import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AlertDialogProps = {
  message?: string | null;
  errors?: Record<string, string> | null;
  variant?: "error" | "success";
};

export default function AlertDialog({ message, errors, variant = "error" }: AlertDialogProps) {
  const hasErrors = errors && Object.keys(errors).length > 0;

  if (!message && !hasErrors) return null;

  return (
    <Alert variant={variant === "error" ? "destructive" : "default"}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        {/* pesan utama */}
        {message && <p>{message}</p>}

        {/* list error per field */}
        {hasErrors && (
          <ul className="mt-1 list-disc pl-4 space-y-0.5">
            {Object.entries(errors).map(([field, msg]) => (
              <li key={field} className="capitalize">
                {field}: {msg}
              </li>
            ))}
          </ul>
        )}
      </AlertDescription>
    </Alert>
  );
}
