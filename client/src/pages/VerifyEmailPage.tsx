/* eslint-disable @typescript-eslint/no-unused-vars */
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { verifyEmail } from "@/features/auth/auth.api";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Helmet } from "react-helmet-async";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  async function onVerifyEmail(token: string) {
    setStatus("loading");
    try {
      const result = await verifyEmail(token);
      console.log("Verification result:", result);
      toast.success(result?.message);
      setStatus("success");
    } catch (err) {
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }
    const verify = async () => {
      console.log("Verifying email with token:", token);
      await onVerifyEmail(token);
    };
    verify();
  }, [token]);

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border bg-background p-8 shadow-sm text-center space-y-6">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <div className="space-y-1">
            <h1 className="text-xl font-semibold">Invalid Link</h1>
            <p className="text-sm text-muted-foreground">No verification token found. Please use the link sent to your email.</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">Back to Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Email Verification - Pixel social media</title>
        <meta name="description" content="Verify your email on Pixel social media." />
        <meta name="keywords" content="email verification, social media, user" />
        <meta property="og:title" content="Email Verification - Pixel social media" />
        <meta property="og:description" content="Verify your email on Pixel social media." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://pixel.ahmadfiqrioemry.com/verify-email?token=${token}`} />
      </Helmet>
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm rounded-2xl border bg-background p-8 shadow-sm text-center space-y-6">
          {status === "loading" && <VerifyLoading />}
          {status === "success" && <VerifySuccess />}
          {status === "error" && <VerifyError />}
        </div>
      </div>
    </>
  );
}

function VerifyLoading() {
  return (
    <>
      <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Verifying your email...</h1>
        <p className="text-sm text-muted-foreground">Please wait a moment.</p>
      </div>
    </>
  );
}

function VerifySuccess() {
  return (
    <>
      <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Email Verified!</h1>
        <p className="text-sm text-muted-foreground">Your account has been activated. You can now sign in.</p>
      </div>
      <Button asChild className="w-full">
        <Link to="/login">Go to Login</Link>
      </Button>
    </>
  );
}

function VerifyError() {
  const message = "Verification failed. The link may be invalid or expired.";

  return (
    <>
      <XCircle className="mx-auto h-12 w-12 text-destructive" />
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">Verification Failed</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      <Button asChild variant="outline" className="w-full">
        <Link to="/login">Back to Login</Link>
      </Button>
    </>
  );
}
