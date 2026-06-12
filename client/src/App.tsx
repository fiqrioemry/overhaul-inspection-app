// src/App.tsx
import Login from "@/pages/LoginPage";
import useTheme from "./hooks/useTheme";
import FeedPage from "@/pages/FeedPage";
import Explore from "@/pages/ExplorePage";
import Register from "@/pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import SettingPage from "@/pages/SettingPage";
import MessagePage from "@/pages/MessagePage";
import NotFoundPage from "@/pages/NotFoundPage";
import PostDetail from "@/pages/PostDetailPage";
import VerifyEmail from "@/pages/VerifyEmailPage";
import AppLayout from "@/components/layout/AppLayout";
import ResetPassword from "@/pages/ResetPasswordPage";
import NotificationPage from "@/pages/NotificationPage";
import ForgotPassword from "@/pages/ForgotPasswordPage";
import OAuthCallbackPage from "@/pages/OAuthCallbackPage";
import SettingAccountPage from "@/pages/SettingAccountPage";
import SettingSecurityPage from "@/pages/SettingSecurityPage";
import SettingNotificationPage from "@/pages/SettingNotificationPage";
import HashtagPage from "@/pages/HashtagPage";
import AdminLayout from "@/components/layout/AdminLayout";
import AdminDashboardPage from "@/pages/AdminDashboardPage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import AdminReportsPage from "@/pages/AdminReportsPage";

import { Toaster } from "sonner";
import { ScrollToTop } from "./hooks/useScrollToTop";
import { Routes, Route, Navigate } from "react-router-dom";
import PublicRoute from "@/features/auth/components/PublicRoute";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import AdminRoute from "@/features/auth/components/AdminRoute";

export default function AppRouter() {
  useTheme();

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-right" richColors />
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<FeedPage />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/message" element={<MessagePage />} />
            <Route path="/notifications" element={<NotificationPage />} />
            <Route path="/profile/:username" element={<ProfilePage />} />
            <Route path="/p/:postId" element={<PostDetail />} />
            <Route path="/hashtag/:name" element={<HashtagPage />} />
            <Route path="/settings" element={<SettingPage />}>
              <Route index element={<Navigate to="account" replace />} />
              <Route path="account" element={<SettingAccountPage />} />
              <Route path="security" element={<SettingSecurityPage />} />
              <Route path="notifications" element={<SettingNotificationPage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/reports" element={<AdminReportsPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
