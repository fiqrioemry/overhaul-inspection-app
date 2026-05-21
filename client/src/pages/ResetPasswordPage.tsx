import { useSearchParams } from "react-router-dom";
import ResetPasswordForm from "@/features/auth/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  return (
    <div className="flex items-center justify-center min-h-screen container mx-auto">
      <ResetPasswordForm token={token} />
    </div>
  );
}
