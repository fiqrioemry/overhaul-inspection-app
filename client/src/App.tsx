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
import CompaniesPage from "@/pages/CompaniesPage";
import ReferenceDocumentsPage from "@/pages/ReferenceDocumentsPage";
import AcceptanceCriteriaPage from "@/pages/AcceptanceCriteriaPage";
import ProcessTemplatesPage from "@/pages/ProcessTemplatesPage";
import ProcessTemplateDetailPage from "@/pages/ProcessTemplateDetailPage";
import TankListPage from "@/pages/TankListPage";
import TankCreatePage from "@/pages/TankCreatePage";
import TankEditPage from "@/pages/TankEditPage";
import TankDetailPage from "@/pages/TankDetailPage";
import TankProcessDetailPage from "@/pages/TankProcessDetailPage";
import InspectionRequestListPage from "@/pages/InspectionRequestListPage";
import InspectionRequestCreatePage from "@/pages/InspectionRequestCreatePage";
import InspectionRequestEditPage from "@/pages/InspectionRequestEditPage";
import InspectionRequestDetailPage from "@/pages/InspectionRequestDetailPage";
import InspectionRequestPrintPage from "@/pages/InspectionRequestPrintPage";
import FindingListPage from "@/pages/FindingListPage";
import DailyReportListPage from "@/pages/DailyReportListPage";
import DailyReportCreatePage from "@/pages/DailyReportCreatePage";
import DailyReportDetailPage from "@/pages/DailyReportDetailPage";
import DailyReportEditPage from "@/pages/DailyReportEditPage";
import DailyReportListPrintPage from "@/pages/DailyReportListPrintPage";
import ProfilePage from "@/pages/ProfilePage";

export default function AppRouter() {
  useTheme();

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-right" richColors closeButton />
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
          {/* Print pages render without the app shell */}
          <Route element={<PermissionRoute permission={PERMISSIONS.INSPECTION_REQUEST_READ} />}>
            <Route path={ROUTES.INSPECTION_REQUEST_PRINT} element={<InspectionRequestPrintPage />} />
          </Route>

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

            {/* Companies */}
            <Route element={<PermissionRoute permission={PERMISSIONS.COMPANY_READ} />}>
              <Route path={ROUTES.MASTER_COMPANIES} element={<CompaniesPage />} />
            </Route>

            {/* Reference Documents */}
            <Route element={<PermissionRoute permission={PERMISSIONS.REFERENCE_DOCUMENT_READ} />}>
              <Route path={ROUTES.MASTER_REFERENCE_DOCS} element={<ReferenceDocumentsPage />} />
            </Route>

            {/* Acceptance Criteria */}
            <Route element={<PermissionRoute permission={PERMISSIONS.ACCEPTANCE_CRITERIA_READ} />}>
              <Route path={ROUTES.MASTER_CRITERIA} element={<AcceptanceCriteriaPage />} />
            </Route>

            {/* Process Templates */}
            <Route element={<PermissionRoute permission={PERMISSIONS.MASTER_PROCESS_READ} />}>
              <Route path={ROUTES.MASTER_PROCESS} element={<ProcessTemplatesPage />} />
              <Route path={ROUTES.PROCESS_TEMPLATE_DETAIL} element={<ProcessTemplateDetailPage />} />
            </Route>

            {/* Tanks */}
            <Route element={<PermissionRoute permission={PERMISSIONS.TANK_READ} />}>
              <Route path={ROUTES.TANKS} element={<TankListPage />} />
              <Route path={ROUTES.TANK_DETAIL} element={<TankDetailPage />} />
              <Route path={ROUTES.PROCESS_DETAIL} element={<TankProcessDetailPage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.TANK_CREATE} />}>
              <Route path={ROUTES.TANK_CREATE} element={<TankCreatePage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.TANK_UPDATE} />}>
              <Route path={ROUTES.TANK_EDIT} element={<TankEditPage />} />
            </Route>

            {/* Inspection Requests */}
            <Route element={<PermissionRoute permission={PERMISSIONS.INSPECTION_REQUEST_CREATE} />}>
              <Route path={ROUTES.INSPECTION_REQUEST_CREATE} element={<InspectionRequestCreatePage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.INSPECTION_REQUEST_UPDATE} />}>
              <Route path={ROUTES.INSPECTION_REQUEST_EDIT} element={<InspectionRequestEditPage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.INSPECTION_REQUEST_READ} />}>
              <Route path={ROUTES.INSPECTION_REQUESTS} element={<InspectionRequestListPage />} />
              <Route path={ROUTES.INSPECTION_REQUEST_DETAIL} element={<InspectionRequestDetailPage />} />
            </Route>

            {/* Findings */}
            <Route element={<PermissionRoute permission={PERMISSIONS.FINDING_READ} />}>
              <Route path={ROUTES.FINDINGS} element={<FindingListPage />} />
            </Route>

            {/* Daily Reports */}
            <Route element={<PermissionRoute permission={PERMISSIONS.DAILY_REPORT_CREATE} />}>
              <Route path={ROUTES.DAILY_REPORT_CREATE} element={<DailyReportCreatePage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.DAILY_REPORT_READ} />}>
              <Route path={ROUTES.DAILY_REPORTS} element={<DailyReportListPage />} />
              <Route path={ROUTES.DAILY_REPORT_LIST_PRINT} element={<DailyReportListPrintPage />} />
              <Route path={ROUTES.DAILY_REPORT_DETAIL} element={<DailyReportDetailPage />} />
            </Route>
            <Route element={<PermissionRoute permission={PERMISSIONS.DAILY_REPORT_UPDATE} />}>
              <Route path={ROUTES.DAILY_REPORT_EDIT} element={<DailyReportEditPage />} />
            </Route>

            {/* Profile */}
            <Route path={ROUTES.PROFILE} element={<ProfilePage />} />

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
