// src/App.tsx
import useTheme from "./hooks/useTheme";
import { Toaster } from "sonner";
import { ScrollToTop } from "./hooks/useScrollToTop";
import { Routes, Route } from "react-router-dom";

import PublicRoute from "@/features/auth/components/PublicRoute";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import PermissionRoute from "@/routes/PermissionRoute";
import AppLayout from "./components/layout/AppLayout";

import { ROUTES } from "@/constants/route.constant";
import { PERMISSIONS } from "@/constants/permission.constant";

import LoginPage from "@/pages/LoginPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import NotFoundPage from "@/pages/NotFoundPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";

import DashboardPage from "@/pages/DashboardPage";
import UserManagementPage from "@/pages/UserManagementPage";
import NotificationPage from "@/pages/NotificationPage";

export default function AppRouter() {
  useTheme();

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-right" richColors />
      <Routes>
        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
          <Route path={ROUTES.VERIFY_EMAIL} element={<VerifyEmailPage />} />
        </Route>

        {/* Standalone public pages */}
        <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
        <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {/* Dashboard */}
            <Route element={<PermissionRoute permission={PERMISSIONS.DASHBOARD_READ} />}>
              <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
            </Route>

            {/* Notifications */}
            <Route element={<PermissionRoute permission={PERMISSIONS.NOTIFICATION_READ} />}>
              <Route path={ROUTES.NOTIFICATIONS} element={<NotificationPage />} />
            </Route>

            {/* User management */}
            <Route element={<PermissionRoute permission={PERMISSIONS.USER_READ} />}>
              <Route path={ROUTES.USERS} element={<UserManagementPage />} />
            </Route>

            {/* Catch-all inside layout → 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        {/* Global catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
