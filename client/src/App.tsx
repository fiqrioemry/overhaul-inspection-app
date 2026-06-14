// src/App.tsx
import Login from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import useTheme from "./hooks/useTheme";

import { Toaster } from "sonner";
import { ScrollToTop } from "./hooks/useScrollToTop";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoute from "@/features/auth/components/PublicRoute";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import SettingPage from "./pages/SettingPage";

export default function AppRouter() {
  useTheme();

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-right" richColors />
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/settings" element={<SettingPage />}>
              <Route index element={<Navigate to="account" replace />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
