# CLAUDE.md — Frontend Code Guidance

**Project:** Tank Progress Monitoring System — Internal SSIE  
**Target:** React + TypeScript SPA, later migratable to Next.js  
**Audience:** Claude Code Agent / AI coding agent  
**Purpose:** This file is the coding guidance and implementation context for the frontend project.

---

## 1. Read This First

You are working on a web application for internal SSIE/Pertamina tank overhaul progress monitoring. The product is not a public social app, not a generic CRUD dashboard, and not a contractor collaboration portal.

The app helps internal users monitor tank construction/overhaul progress, daily activities, inspection findings, checklist/acceptance criteria, inspection/test review requests, test records, radiography records, file attachments, notifications, and printable reports.

The frontend MUST follow the PRD v2.1 Internal SSIE RBAC document as the single product source of truth.

Core domain separation:

```text
Process/Test       = tahapan pekerjaan atau pengujian aktual.
Parameter/Criteria = syarat teknis yang harus dicek dan punya reference document.
Checklist Result   = hasil pengecekan parameter pada tank process tertentu.
Finding            = temuan aktual ketika parameter tidak terpenuhi.
Dependency         = syarat process/test lain harus sudah passed.
Reference Document = sumber acuan acceptance criteria.
Notification       = pemberitahuan internal untuk assignment, review, finding, reminder, dan progress update.
```

Do NOT merge these concepts into one generic `finding` model.

---

## 2. Frontend Tech Stack

Use:

```text
React
TypeScript
Vite
React Router DOM
TanStack Query
Axios
Zustand
Tailwind CSS
shadcn/ui
React Hook Form
Zod
@hookform/resolvers
qs
react-dropzone
react-image-crop or react-crop-image
Rich text editor, preferably TipTap or React Quill
Lucide React icons
i18next + react-i18next
sonner or shadcn toast
react-helmet-async
class-variance-authority
clsx
tailwind-merge
date-fns
```

Do NOT use Next.js in this frontend version. Keep the code modular so it can be migrated later.

---

## 3. Role and Permission Rule

The frontend MUST NOT rely on role checks for UI actions.

Role exists only as a high-level identity:

```ts
type RoleEnum = "USER" | "INSPECTOR" | "ADMIN" | "SUPER_ADMIN";
```

Frontend access control MUST use permission keys returned by:

```http
GET /api/v1/auth/me
```

Expected auth response includes:

```ts
type MeResponse = {
  user: AuthUser;
  permissions: string[];
};
```

Correct UI pattern:

```tsx
{
  can("finding.create") && <Button>Add Finding</Button>;
}
{
  can("inspection_request.review") && <Button>Mark as Reviewed</Button>;
}
{
  can("user.create") && <Button>Create User</Button>;
}
```

Avoid:

```tsx
if (user.role === "INSPECTOR") {
  // bad pattern
}
```

The only acceptable role usage in frontend is for display labels, profile badges, or secondary UX hints. Never use role directly as the source of action authorization.

---

## 4. Required Permission Keys

The frontend should define permission keys in constants and never write arbitrary strings everywhere.

Create:

```text
/src/constants/permission.constant.ts
```

With at least:

```ts
export const PERMISSIONS = {
  DASHBOARD_READ: "dashboard.read",

  USER_CREATE: "user.create",
  USER_READ: "user.read",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",

  TANK_CREATE: "tank.create",
  TANK_READ: "tank.read",
  TANK_UPDATE: "tank.update",

  PROCESS_READ: "process.read",
  PROCESS_UPDATE: "process.update",

  DAILY_REPORT_CREATE: "daily_report.create",
  DAILY_REPORT_READ: "daily_report.read",
  DAILY_REPORT_UPDATE: "daily_report.update",
  DAILY_REPORT_PRINT: "daily_report.print",

  FINDING_CREATE: "finding.create",
  FINDING_READ: "finding.read",
  FINDING_UPDATE: "finding.update",
  FINDING_CLOSE: "finding.close",

  CHECKLIST_READ: "checklist.read",
  CHECKLIST_UPDATE: "checklist.update",

  INSPECTION_REQUEST_CREATE: "inspection_request.create",
  INSPECTION_REQUEST_READ: "inspection_request.read",
  INSPECTION_REQUEST_REVIEW: "inspection_request.review",
  INSPECTION_REQUEST_UPDATE: "inspection_request.update",

  TEST_RECORD_CREATE: "test_record.create",
  TEST_RECORD_READ: "test_record.read",
  TEST_RECORD_UPDATE: "test_record.update",

  RADIOGRAPHY_CREATE: "radiography.create",
  RADIOGRAPHY_READ: "radiography.read",
  RADIOGRAPHY_UPDATE: "radiography.update",

  FILE_UPLOAD: "file.upload",
  FILE_READ: "file.read",

  MASTER_PROCESS_CREATE: "master_process.create",
  MASTER_PROCESS_READ: "master_process.read",
  MASTER_PROCESS_UPDATE: "master_process.update",

  ACCEPTANCE_CRITERIA_CREATE: "acceptance_criteria.create",
  ACCEPTANCE_CRITERIA_READ: "acceptance_criteria.read",
  ACCEPTANCE_CRITERIA_UPDATE: "acceptance_criteria.update",

  REFERENCE_DOCUMENT_CREATE: "reference_document.create",
  REFERENCE_DOCUMENT_READ: "reference_document.read",
  REFERENCE_DOCUMENT_UPDATE: "reference_document.update",

  COMPANY_CREATE: "company.create",
  COMPANY_READ: "company.read",
  COMPANY_UPDATE: "company.update",

  NOTIFICATION_CREATE: "notification.create",
  NOTIFICATION_READ: "notification.read",
  NOTIFICATION_UPDATE: "notification.update",
} as const;
```

---

## 5. Required Auth Store

Create or update:

```text
/src/stores/auth.store.ts
```

Required behavior:

```ts
type AuthState = {
  user: AuthUser | null;
  permissions: string[];
  isAuthenticated: boolean;
  isBootstrapped: boolean;
  setAuth: (payload: { user: AuthUser; permissions: string[] }) => void;
  clearAuth: () => void;
  can: (permission: string) => boolean;
  canAny: (permissions: string[]) => boolean;
  canAll: (permissions: string[]) => boolean;
};
```

Implementation rule:

```ts
can(permission) returns true when permissions includes "*" or exact permission.
```

Never duplicate `can()` logic inside components.

---

## 6. Folder Structure

Use this feature-based structure:

```text
/public/
  locales/
    en/
      auth.json
      dashboard.json
      tank.json
      process.json
      finding.json
      checklist.json
      inspection-request.json
      daily-report.json
      test-record.json
      radiography.json
      notification.json
      common.json
    id/
      auth.json
      dashboard.json
      tank.json
      process.json
      finding.json
      checklist.json
      inspection-request.json
      daily-report.json
      test-record.json
      radiography.json
      notification.json
      common.json

/src/
  assets/

  components/
    common/
      EmptyState.tsx
      ErrorState.tsx
      LoadingState.tsx
      ConfirmDialog.tsx
      PermissionGate.tsx
      StatusBadge.tsx
      PageHeader.tsx
      DataTable.tsx
      PrintToolbar.tsx
    fields/
      TextField.tsx
      TextAreaField.tsx
      SelectField.tsx
      DateField.tsx
      NumberField.tsx
      FileDropzoneField.tsx
      RichTextField.tsx
    layout/
      AppLayout.tsx
      Sidebar.tsx
      Navbar.tsx
      Breadcrumbs.tsx
      MobileNav.tsx
    ui/
      # shadcn generated components

  constants/
    api.constant.ts
    auth.constant.ts
    permission.constant.ts
    tank.constant.ts
    process.constant.ts
    finding.constant.ts
    checklist.constant.ts
    inspection-request.constant.ts
    daily-report.constant.ts
    test-record.constant.ts
    radiography.constant.ts
    notification.constant.ts
    file.constant.ts
    route.constant.ts

  features/
    auth/
      components/
      auth.api.ts
      auth.query.ts
      auth.types.ts
    users/
      components/
      users.api.ts
      users.query.ts
      users.types.ts
    dashboard/
      components/
      dashboard.api.ts
      dashboard.query.ts
      dashboard.types.ts
    tanks/
      components/
      tanks.api.ts
      tanks.query.ts
      tanks.types.ts
    processes/
      components/
      processes.api.ts
      processes.query.ts
      processes.types.ts
    checklist/
      components/
      checklist.api.ts
      checklist.query.ts
      checklist.types.ts
    findings/
      components/
      findings.api.ts
      findings.query.ts
      findings.types.ts
    inspection-requests/
      components/
      inspection-requests.api.ts
      inspection-requests.query.ts
      inspection-requests.types.ts
    daily-reports/
      components/
      daily-reports.api.ts
      daily-reports.query.ts
      daily-reports.types.ts
    test-records/
      components/
      test-records.api.ts
      test-records.query.ts
      test-records.types.ts
    radiography/
      components/
      radiography.api.ts
      radiography.query.ts
      radiography.types.ts
    files/
      components/
      files.api.ts
      files.query.ts
      files.types.ts
    notifications/
      components/
      notifications.api.ts
      notifications.query.ts
      notifications.types.ts
    master-data/
      components/
      master-data.api.ts
      master-data.query.ts
      master-data.types.ts

  hooks/
    useDebounce.ts
    useDisclosure.ts
    usePagination.ts
    usePermission.ts
    usePrint.ts
    useQueryParams.ts
    useUpload.ts

  lib/
    axios.ts
    query.ts
    i18n.ts
    env.ts
    cn.ts

  pages/
    LoginPage.tsx
    DashboardPage.tsx
    TankListPage.tsx
    TankDetailPage.tsx
    ProcessDetailPage.tsx
    DailyReportListPage.tsx
    DailyReportPrintPage.tsx
    FindingListPage.tsx
    InspectionRequestListPage.tsx
    TestRecordPage.tsx
    RadiographyPage.tsx
    MasterDataPage.tsx
    UserManagementPage.tsx
    NotificationPage.tsx
    NotFoundPage.tsx
    ForbiddenPage.tsx

  routes/
    ProtectedRoute.tsx
    PublicRoute.tsx
    PermissionRoute.tsx
    routes.tsx

  schemas/
    auth.schema.ts
    users.schema.ts
    tanks.schema.ts
    processes.schema.ts
    checklist.schema.ts
    findings.schema.ts
    inspection-requests.schema.ts
    daily-reports.schema.ts
    test-records.schema.ts
    radiography.schema.ts
    files.schema.ts
    notifications.schema.ts
    master-data.schema.ts

  stores/
    auth.store.ts
    ui.store.ts
    upload.store.ts
    notification.store.ts

  types/
    response.type.ts
    pagination.type.ts
    common.type.ts

  utils/
    formatDate.ts
    formatFileSize.ts
    formatStatus.ts
    formatString.ts
    buildQueryString.ts
    downloadFile.ts
    print.ts

  App.tsx
  main.tsx
  index.css
```

---

## 7. API Layer Rules

Every feature has:

```text
feature.api.ts    = raw axios calls only
feature.query.ts  = TanStack Query hooks only
feature.types.ts  = feature response/request types if needed
```

API functions MUST NOT call React hooks.

Query hooks MUST NOT contain UI logic.

Example:

```ts
// tanks.api.ts
export async function getTanks(params: TankListParams) {
  const res = await api.get<ResponseSuccess<PaginatedResponse<TankSummary>>>("//api/v1/tanks", { params });
  return res.data.data;
}
```

```ts
// tanks.query.ts
export function useTanks(params: TankListParams) {
  return useQuery({
    queryKey: ["tanks", params],
    queryFn: () => getTanks(params),
  });
}
```

Use `qs` for nested filters and arrays when needed.

---

## 8. Axios Rules

Create:

```text
/src/lib/axios.ts
```

Requirements:

1. Base URL from env.
2. Include credentials or bearer token according to backend auth design.
3. Transform API errors into a consistent frontend error object.
4. If response is `401`, clear auth and redirect to login.
5. Do not swallow backend validation errors.
6. Support multipart upload.

Expected response shape:

```ts
type ResponseSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type ResponseError = {
  success: false;
  message: string;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
};
```

---

## 9. Forms and Validation Rules

Use React Hook Form + Zod for all forms.

Rules:

1. Every form must have a Zod schema.
2. Infer TypeScript types from Zod when possible.
3. Use reusable field components from `/components/fields`.
4. Show backend validation errors next to fields when possible.
5. Do not submit empty strings for optional numeric/date fields; convert to `undefined` or `null` according to API contract.
6. Date inputs should use ISO date string format: `YYYY-MM-DD`.

Example:

```ts
const createTankSchema = z.object({
  tankNo: z.string().min(1),
  diameterMm: z.coerce.number().positive().optional(),
  heightMm: z.coerce.number().positive().optional(),
  shellCourseCount: z.coerce.number().int().positive(),
  hasSteamCoil: z.boolean().default(false),
});
```

---

## 10. UI/UX Page Requirements

### 10.1 Dashboard

Show:

1. Total tank.
2. In progress tank.
3. Completed tank.
4. Open findings.
5. Request waiting review.
6. Test completed.
7. Tank table with progress percent, current process, finding count, and action.

### 10.2 Tank Detail

Show:

1. Tank information.
2. Shell course table.
3. Progress/process timeline.
4. Current active process.
5. Open finding summary.
6. Review request summary.
7. Attachments.

### 10.3 Process Detail

Tabs:

```text
Overview
Checklist
Findings
Daily Activity
Test Record, if process type is test/ndt
Attachments
```

### 10.4 Checklist

Checklist rows must show:

```text
Parameter name
Acceptance criteria
Method
Tools
Reference document
Actual value/text
Status
Checked by
Checked at
Action
```

If status is failed, user with `finding.create` should be able to create finding from that checklist item.

### 10.5 Finding

Finding rows must show:

```text
Finding no
Tank
Process
Criteria
Title
Location
Severity
Status
Created by
Created at
Action
```

Status flow:

```text
OPEN -> IN_REPAIR -> REPAIRED -> VERIFIED -> CLOSED
```

### 10.6 Inspection Request

USER/Pertamina SSIE can review request only when they have:

```text
inspection_request.review
```

Use action text:

```text
Mark as Reviewed
```

Do not use heavy approval wording unless PRD says so.

### 10.7 Daily Report

Inspector can create daily report. The form should auto-select current active process for the selected tank when possible.

Daily report print page must be clean and printable. It should include:

```text
Project information
Tank number
Report date
Inspector name
Pertamina/SSIE PIC
Activity description
Attachments/photos
Signature section
Company logo if available
```

### 10.8 Radiography

Radiography form must support:

```text
Total joint
Total shot
Total accepted
Total repair
Total reshoot
Joint number
Location
Welder number
Film number
Result
Defect type
Repair status
Remarks
```

---

## 11. File Upload Rules

Use `react-dropzone` for upload UI.

Upload flow:

1. User selects file.
2. Frontend validates file type and size before upload.
3. Upload to backend `/api/v1/files/upload`.
4. Backend stores in MinIO and returns `FileStorage` metadata.
5. Frontend attaches returned file id to the module entity.

Do not upload directly to MinIO from frontend unless backend explicitly provides signed URL flow.

File preview:

1. Image: show thumbnail.
2. PDF: show icon/name.
3. Video: show icon/name or lightweight preview.
4. Unknown: show generic file icon.

---

## 12. Notification UI

Implement:

1. Notification bell in navbar.
2. Unread count badge.
3. Notification list page.
4. Mark as read.
5. Notification settings page or modal.

Notification types should be shown with readable labels:

```text
INSPECTION_ASSIGNED
INSPECTION_REMINDER
INSPECTION_REQUEST_SUBMITTED
INSPECTION_REQUEST_REVIEWED
FINDING_CREATED
FINDING_CLOSED
TEST_COMPLETED
```

If backend only has fewer enum values at first, gracefully render unknown values using title case.

---

## 13. Print and Report Rules

Print pages must not use the normal app sidebar/navbar.

Create dedicated pages or components:

```text
DailyReportPrintPage
InspectionChecklistPrintPage
TestReportPrintPage
RadiographyReportPrintPage
```

Print CSS requirements:

```css
@media print {
  .no-print {
    display: none;
  }
  body {
    background: white;
  }
  .print-page {
    box-shadow: none;
    margin: 0;
  }
}
```

Prefer A4 portrait for daily report and A4 landscape for dense tables.

---

## 14. Naming Convention

Use:

```text
PascalCase for components and pages.
camelCase for variables and functions.
kebab-case for route paths.
SCREAMING_SNAKE_CASE for permission constant keys.
```

Examples:

```text
TankDetailPage.tsx
CreateFindingDialog.tsx
useTankDetail()
PERMISSIONS.FINDING_CREATE
/api/v1/inspection-requests/:id/review
```

---

## 15. Route Guidance

Suggested routes:

```text
/login
/dashboard
/tanks
/tanks/:tankId
/tanks/:tankId/processes/:processId
/findings
/daily-reports
/daily-reports/:id/print
/inspection-requests
/test-records
/radiography
/master-data/processes
/master-data/acceptance-criteria
/master-data/reference-documents
/master-data/companies
/users
/notifications
/settings/notifications
/403
/404
```

Protect routes using `PermissionRoute`, not role-only checks.

---

## 16. Component Rules

Components should be small and composable.

Do:

```text
TankSummaryCards
TankProgressTable
TankProcessTimeline
ChecklistTable
FindingStatusBadge
InspectionRequestReviewDialog
DailyReportForm
FileAttachmentGrid
```

Avoid giant page files containing all logic.

Page files should compose feature components and query hooks only.

---

## 17. State Management Rules

Use TanStack Query for server state.

Use Zustand only for client state:

```text
auth state
sidebar state
theme/language state
upload drawer state
notification UI state
```

Do not duplicate server data into Zustand unless needed for temporary UI state.

---

## 18. Error, Empty, and Loading States

Every data page must handle:

```text
loading
error
empty
success
forbidden
```

Use reusable components:

```text
LoadingState
ErrorState
EmptyState
ForbiddenPage
```

---

## 19. Implementation Order

Implement frontend in this order:

1. Base project setup.
2. Tailwind + shadcn/ui.
3. Axios + QueryClient + response types.
4. Auth store + `/auth/me` bootstrap.
5. Permission constants + `PermissionGate` + `PermissionRoute`.
6. Layout: sidebar, navbar, breadcrumb.
7. Login page.
8. Dashboard.
9. Tank list and tank detail.
10. Process detail tabs.
11. Checklist.
12. Findings.
13. Daily reports + print page.
14. Inspection requests + review action.
15. Test records.
16. Radiography.
17. File upload and attachment grid.
18. Notifications.
19. User management.
20. Master data pages.
21. Polish, accessibility, responsive UI.

---

## 20. Anti-Patterns to Avoid

Do NOT:

1. Hardcode role checks for buttons.
2. Put API calls directly inside components.
3. Mix parameter, finding, test, and dependency concepts.
4. Store server data in Zustand unnecessarily.
5. Create one giant `types.ts` for all features.
6. Create forms without Zod schemas.
7. Ignore backend permission errors.
8. Build print pages inside modal only.
9. Use `any` unless unavoidable and documented.
10. Rename backend response fields without a mapping layer.
11. Assume all tanks have steam coil.
12. Assume every process is required; some process may be optional/not applicable.
13. Let frontend decide eligibility alone; backend must be source of truth.

---

## 21. Coding Agent Output Rules

When implementing:

1. Follow the folder structure exactly unless there is a strong reason.
2. Keep files focused and readable.
3. Prefer complete working features over placeholder UI.
4. Add TODO comments only for intentionally deferred integration.
5. Do not invent new domain models outside PRD.
6. Keep names aligned with backend API contract.
7. Ensure TypeScript builds without errors.
8. Ensure lint issues are minimized.
9. Use permission keys consistently.
10. Create reusable components when patterns repeat.

---

## 22. Final Reminder

This frontend is for internal inspection/progress monitoring. The most important UX is clarity: inspector must quickly input daily activity, findings, checklist result, test result, and attachments; USER/SSIE must quickly see progress and mark inspection/test request as reviewed.
