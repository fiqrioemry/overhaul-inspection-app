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
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setMessage("Verification token is missing.");
      setState("error");
      return;
    }

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        {state === "loading" && (
          <>
            <Loader2 className="size-12 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <CheckCircle className="size-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Email verified</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <Button asChild className="w-full">
              <Link to={ROUTES.LOGIN}>Go to Login</Link>
            </Button>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">Verification failed</h1>
              <p className="text-sm text-muted-foreground">{message}</p>
            </div>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link to={ROUTES.LOGIN}>Back to Login</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to={ROUTES.FORGOT_PASSWORD}>Request new link</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
