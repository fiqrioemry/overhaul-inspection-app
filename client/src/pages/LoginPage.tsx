import { Helmet } from "react-helmet-async";
import { ShieldCheck } from "lucide-react";
import LoginForm from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Login — Pantau Inspeksi</title>
      </Helmet>

      <div className="min-h-screen flex flex-col bg-slate-100">

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
            <span className="text-primary-foreground/50 text-xs hidden sm:block">PT. Sucofindo (Persero)</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md space-y-6">

            {/* System info above card */}
            <div className="text-center space-y-1">
              <h1 className="text-lg font-semibold text-slate-700">Akses Sistem</h1>
              <p className="text-sm text-slate-500">
                Masukkan kredensial yang telah diberikan oleh administrator
              </p>
            </div>

            {/* Login card */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8">
              <LoginForm />
            </div>

            {/* Security note */}
            <p className="text-center text-xs text-slate-400">
              Sistem ini hanya untuk pengguna yang telah terdaftar.
              <br />
              Jika mengalami kendala akses, hubungi administrator.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white">
          <div className="max-w-7xl mx-auto px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-1">
            <span className="text-xs text-slate-400">
              © {new Date().getFullYear()} PT. Sucofindo (Persero). All rights reserved.
            </span>
            <span className="text-xs text-slate-300">v2.1 Internal SSIE</span>
          </div>
        </footer>
      </div>
    </>
  );
}
