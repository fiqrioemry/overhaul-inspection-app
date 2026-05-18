import Login from "@/pages/LoginPage";
import FeedPage from "@/pages/FeedPage";
import Explore from "@/pages/ExplorePage";
import Register from "@/pages/RegisterPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "@/pages/NotFoundPage";
import PostDetail from "@/pages/PostDetailPage";
import VerifyEmail from "@/pages/VerifyEmailPage";
import ResetPassword from "@/pages/ResetPasswordPage";
import NotificationPage from "@/pages/NotificationPage";
import ForgotPassword from "@/pages/ForgotPasswordPage";

import useTheme from "./hooks/useTheme";
import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import PublicRoute from "@/features/auth/components/PublicRoute";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import SettingPage from "./pages/SettingPage";
import SettingAccountPage from "./pages/SettingAccountPage";
import SettingSecurityPage from "./pages/SettingSecurityPage";
import SettingNotificationPage from "./pages/SettingNotificationPage";
import MessagePage from "./pages/MessagePage";

export default function AppRouter() {
  useTheme();

  // Scroll to top on route change
  window.scrollTo({ top: 0, left: 0, behavior: "smooth" });

  return (
    <Routes>
      <Route path="*" element={<NotFoundPage />} />
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/message" element={<MessagePage />} />
          <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/profile/:username" element={<ProfilePage />} />
          <Route path="/p/:postId" element={<PostDetail />} />
          <Route path="/settings" element={<SettingPage />}>
            <Route index element={<Navigate to="account" replace />} />
            <Route path="account" element={<SettingAccountPage />} />
            <Route path="security" element={<SettingSecurityPage />} />
            <Route path="notifications" element={<SettingNotificationPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
