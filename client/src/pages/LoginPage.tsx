import { Helmet } from "react-helmet-async";
import { ShieldCheck } from "lucide-react";
import LoginForm from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Login — Pantau Inspeksi</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-muted">
        {/* Corporate header */}
        <header className="bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 opacity-80" />
                <span className="font-semibold text-sm tracking-wide uppercase">Pantau Inspeksi</span>
              </div>
              <span className="text-primary-foreground/30 text-sm">|</span>
              <span className="text-primary-foreground/60 text-xs">Sistem Monitoring Overhaul Tangki</span>
            </div>
            <span className="text-primary-foreground/50 text-xs hidden sm:block">PT. Pertamina Patra Niaga</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-6">
            {/* Login card */}
            <div className="bg-card rounded-lg border border-border shadow-sm p-8">
              <LoginForm />
            </div>

            {/* Security note */}
            <p className="text-center text-xs text-muted-foreground/70">Sistem ini untuk penggunaan internal project overhaul tangki PT. Pertamina Patra Niaga.</p>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-1">
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()} PT. Pertamina Patra Niaga. All rights reserved.</span>
            <span className="text-xs text-muted-foreground/50">v2.1 Internal SSIE</span>
          </div>
        </footer>
      </div>
    </>
  );
}
