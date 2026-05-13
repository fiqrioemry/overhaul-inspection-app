import PublicRoute from "./PublicRoute";
import ProtectedRoute from "./ProtectedRoute";
import { Routes, Route } from "react-router-dom";

// auth features
import Login from "@/features/auth/pages/Login";
import Explore from "@/features/posts/pages/Explore";
import Register from "@/features/auth/pages/Register";
import VerifyEmail from "@/features/auth/pages/VerifyEmail";
import ResetPassword from "@/features/auth/pages/ResetPassword";
import ForgotPassword from "@/features/auth/pages/ForgotPassword";
import FollowingPosts from "@/features/posts/pages/FollowingPosts";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<FollowingPosts />} />
        <Route path="/explore" element={<Explore />} />
      </Route>
    </Routes>
  );
}
