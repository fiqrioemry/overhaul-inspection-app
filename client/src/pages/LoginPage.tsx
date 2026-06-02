import LoginForm from "@/features/auth/components/LoginForm";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";

export default function LoginPage() {
  const { t } = useTranslation(["auth"]);
  const { isEnglish, toggleLanguage } = useLanguage();

  const brandFeatures = [
    t("auth:loginBrandFeature1"),
    t("auth:loginBrandFeature2"),
    t("auth:loginBrandFeature3"),
  ];

  return (
    <>
      <Helmet>
        <title>Login - Pixel social media</title>
        <meta name="description" content="Login to access your dashboard and manage your account." />
        <meta name="keywords" content="login, authentication, dashboard" />
        <meta property="og:title" content="Login - Pixel social media" />
        <meta property="og:description" content="Login to access your dashboard and manage your account." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://pixel.ahmadfiqrioemry/login" />
      </Helmet>

      <div className="min-h-screen flex">
        {/* Brand panel */}
        <div className="hidden lg:flex lg:w-[42%] bg-primary flex-col justify-between p-12 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <span className="relative font-bold text-2xl tracking-tight text-primary-foreground">
            Pixel<span className="opacity-50">.</span>
          </span>

          <div className="relative space-y-8">
            <div className="space-y-3">
              <h2 className="text-[2.6rem] font-bold leading-[1.15] text-primary-foreground whitespace-pre-line">
                {t("auth:loginBrandHeadline")}
              </h2>
              <p className="text-primary-foreground/60 text-base leading-relaxed max-w-xs">
                {t("auth:loginBrandTagline")}
              </p>
            </div>

            <ul className="space-y-3">
              {brandFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span className="mt-1.75 size-1.5 rounded-full bg-primary-foreground/40 shrink-0" />
                  <span className="text-primary-foreground/70 text-sm leading-relaxed">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <span className="relative text-primary-foreground/25 text-xs">{t("auth:brandCopyright")}</span>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex flex-col min-h-screen bg-background">
          {/* Top bar */}
          <div className="flex items-center justify-between px-6 py-5">
            <span className="lg:hidden font-bold text-xl tracking-tight text-foreground">
              Pixel<span className="text-primary">.</span>
            </span>
            <div className="ml-auto flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => !isEnglish && toggleLanguage()}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  isEnglish ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>🇺🇸</span>
                <span>EN</span>
              </button>
              <button
                type="button"
                onClick={() => isEnglish && toggleLanguage()}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  !isEnglish ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <span>🇮🇩</span>
                <span>ID</span>
              </button>
            </div>
          </div>

          {/* Centered form */}
          <div className="flex-1 flex items-center justify-center px-6 pb-10">
            <LoginForm />
          </div>
        </div>
      </div>
    </>
  );
}
