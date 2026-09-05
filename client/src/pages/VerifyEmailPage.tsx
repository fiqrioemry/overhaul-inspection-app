import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/features/auth/auth.api";
import { ROUTES } from "@/constants/route.constant";

type VerifyState = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<VerifyState>(token ? "loading" : "error");
  const [message, setMessage] = useState(token ? "" : "Verification token is missing.");

  useEffect(() => {
    if (!token) return;

    verifyEmail(token)
      .then((res) => {
        setMessage(res.message ?? "Email verified successfully.");
        setState("success");
      })
      .catch(() => {
        setMessage("This verification link is invalid or has expired.");
        setState("error");
      });
  }, [token]);

  return <div className="min-h-screen flex items-center justify-center bg-background p-6"></div>;
}
