# BATCH 1 — Core Backend, Auth, User Management, RBAC, Notification, File Storage

You are working on the backend/server project for an internal SSIE Tank Progress Monitoring web application.

Read `PRD.md` completely and carefully before writing or modifying any code. Treat `PRD.md` as the single source of truth.

Also read `CLAUDE.md` if available. Follow its coding rules, folder structure, naming convention, architectural pattern, and implementation guidance.

This is BATCH 1. Do not implement all modules yet. Focus only on:

1. Core backend/server setup
2. Existing auth module review and adjustment
3. User management module
4. RBAC permission system
5. Notification module
6. File storage module
7. Shared utilities
8. Prisma schema alignment for existing auth/file/notification modules
9. Base seed data for users and companies if needed

Important:

- This project uses an existing backend template.
- Some modules already exist: auth, users, file storage, notifications.
- Review existing code first.
- Do not blindly delete working code.
- If existing code is outside PRD scope, adapt or disable public access.
- Do not implement tank progress, findings, checklist, test records, radiography, dashboard, or master process modules in this batch.

Tech stack:

- Bun runtime
- Hono
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- Self-hosted MinIO
- Zod
- Sharp
- Nodemailer
- dotenv

Auth requirements:

1. Public registration must not exist.
2. Replace public registration with `SUPER_ADMIN create user`.
3. Login must remain available.
4. Logout must remain available.
5. `/auth/me` must return authenticated user and permissions.
6. Password must be hashed.
7. Email verification may remain if already implemented.
8. Password reset may remain if already implemented.
9. OAuth schema may remain if already present, but OAuth login is not required unless already safely implemented.
10. User status must support:

- `ACTIVE`
- `INACTIVE`
- `BANNED`

Required roles:

- `USER`
- `INSPECTOR`
- `ADMIN`
- `SUPER_ADMIN`

RBAC requirements:

Backend must be the source of truth for permissions.

Frontend must consume permission keys, not hardcoded role checks.

Implement role-to-permission mapping in backend.

Implement middleware:

```ts
requirePermission("permission.key");
```

Example permission keys:

```txt
dashboard.read
user.read
user.create
user.update
user.delete
notification.read
notification.update
file.upload
file.read
```

`GET /api/v1/auth/me` must return:

```json
{
  "success": true,
  "message": "Authenticated user retrieved successfully",
  "data": {
    "user": {
      "id": "string",
      "email": "string",
      "name": "string",
      "role": "INSPECTOR",
      "status": "ACTIVE",
      "verifiedAt": "2026-06-15T00:00:00.000Z"
    },
    "permissions": ["dashboard.read", "tank.read", "finding.create"]
  }
}
```

Use the existing Prisma schema style:

- Use `@map` for mapped columns.
- Use `@@map` for table aliases.
- Preserve existing models where possible:
  - `User`
  - `Session`
  - `UserVerification`
  - `OAuthAccount`
  - `UserActivityLog`
  - `FileStorage`
  - `Notification`
  - `NotificationSetting`

Implement or adjust these modules:

## 1. Core Setup

- Config loader
- Environment validation
- Hono app initialization
- CORS
- Centralized error handler
- Not found handler
- Health check route
- Logger if already used by existing template
- Prisma client initialization
- Redis initialization
- MinIO initialization
- Nodemailer initialization

## 2. Auth

Endpoints:

```txt
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-email
```

Do not expose:

```txt
POST /api/v1/auth/register
```

If existing register route exists, remove it or disable it.

## 3. User Management

Endpoints:

```txt
POST   /api/v1/users
GET    /api/v1/users
GET    /api/v1/users/:id
PATCH  /api/v1/users/:id
PATCH  /api/v1/users/:id/status
PATCH  /api/v1/users/:id/password
DELETE /api/v1/users/:id
```

Rules:

- Only `SUPER_ADMIN` can create users.
- `SUPER_ADMIN` can choose whether user is immediately verified.
- `SUPER_ADMIN` can assign role.
- Soft delete users if schema supports `deletedAt`.
- Do not allow normal users to escalate their own role.

## 4. Notifications

Endpoints:

```txt
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/read-all
DELETE /api/v1/notifications/:id
GET    /api/v1/notification-settings
PATCH  /api/v1/notification-settings
```

Requirements:

- In-app notification must work.
- Email notification should use Nodemailer if setting is enabled.
- Notification service should be reusable by future modules.
- Do not implement tank-specific notification events yet, but prepare service function for later modules.

## 5. File Storage

Endpoints:

```txt
POST   /api/v1/files/upload
GET    /api/v1/files/:id
DELETE /api/v1/files/:id
```

Requirements:

- Upload files to MinIO.
- Store metadata in `file_storages`.
- Validate file size and MIME type.
- Support image/document/video if PRD allows.
- Use Sharp for image metadata/thumbnail/optimization if already planned.
- Mark file as used later when attached to a target entity.
- Use existing `module`, `targetId`, and `isUsed` pattern.

## 6. Shared Utilities

Implement or adjust:

- response helper
- error helper
- pagination helper
- validation helper
- auth middleware
- permission middleware
- password hashing utility
- JWT/session utility
- file validation utility

Response format must be consistent:

Success:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Pagination:

```json
{
  "success": true,
  "message": "string",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

Error:

```json
{
  "success": false,
  "message": "string",
  "errors": []
}
```

Seed data for this batch:

Create:

1. One `SUPER_ADMIN`
2. One `ADMIN`
3. One `INSPECTOR`
4. One `USER`
5. Company:
   - PT Pertamina Patra Niaga
   - PT Biro Klasifikasi Indonesia
   - One sample contractor

After implementation:

1. Run typecheck/build/lint if scripts exist.
2. Fix compile errors.
3. Provide summary:
   - files changed
   - modules implemented
   - endpoints added
   - schema changes
   - seed data added
   - commands to run
   - known assumptions

Do not continue to Batch 2 until I review and approve Batch 1.

## Do not stop after planning. Implement the code for Batch 1.

# BATCH 2 — Master Data Modules

You are continuing the backend/server project for the internal SSIE Tank Progress Monitoring web application.

Read `PRD.md`, `CLAUDE.md`, and the code generated in Batch 1 before making changes.

This is BATCH 2. Focus only on master data modules.

Do not implement tank progress, checklist result, findings, inspection requests, test records, radiography, dashboard, or print/report modules yet.

Implement these modules:

1. Company master data
2. Reference document master data
3. Acceptance criteria / inspection parameter master data
4. Process template master data
5. Process criteria template mapping
6. Process dependency mapping

Important domain rule:

Keep these concepts strictly separated:

1. `Process/Test`
2. `Acceptance Criteria / Parameter`
3. `Checklist Result`
4. `Finding`
5. `Dependency / Prerequisite`
6. `Reference Document`

In this batch, implement only master data:

- `Company`
- `ReferenceDocument`
- `AcceptanceCriteria`
- `CriteriaReference`
- `ProcessTemplate`
- `ProcessCriteriaTemplate`
- `ProcessDependency`

Acceptance criteria must not be stored as findings.

Process/test must not be stored as findings.

Database requirements:

- Use Prisma.
- Use `@map` for mapped columns.
- Use `@@map` for table names.
- Follow existing schema conventions from Batch 1.
- Keep enums aligned with PRD.

Required master data models:

## Company

Fields should cover:

- name
- role
- logo/file reference if needed
- status
- createdAt
- updatedAt
- deletedAt if project convention uses soft delete

Company is used for:

- Pertamina/User
- Inspection body
- Contractor

## Reference Document

Fields should cover:

- code
- title
- documentType
- revision
- issuer
- fileStorageId or fileUrl
- status
- createdAt
- updatedAt
- deletedAt if needed

This stores references such as:

- KAK Pertamina
- API 650
- ASME IX
- WPS
- ITP
- project procedure

## Acceptance Criteria

Fields should cover:

- code
- name
- description
- acceptanceType
- operator
- minValue
- maxValue
- unit
- acceptanceText
- method
- tools
- isCountable
- isRequired
- severity
- status
- createdAt
- updatedAt
- deletedAt if needed

Acceptance types:

```txt
PASS_FAIL
NUMERIC_MIN
NUMERIC_MAX
NUMERIC_RANGE
TEXT
DEPENDENCY
```

## Criteria Reference

Fields should cover:

- criteriaId
- referenceDocumentId
- clause
- page
- notes

Rule:

- Acceptance criteria should have at least one reference document.
- Do not allow criteria without reference unless explicitly marked draft.

## Process Template

Fields should cover:

- code
- name
- type
- sequenceOrder
- isOptional
- applicabilityRule
- isActive
- createdAt
- updatedAt
- deletedAt if needed

Process types:

```txt
WORK
INSPECTION
TEST
NDT
COATING
COMMISSIONING
```

## Process Criteria Template

Fields should cover:

- processTemplateId
- criteriaId
- sequenceOrder
- isRequired
- applicabilityRule

Purpose:

- Attach inspection/acceptance criteria to process templates.

Example:

Bottom Plate Installation requires:

- bottom overlap min 5 cm
- visual weld clean from slag
- visual weld clean from spatter
- no excessive undercut

## Process Dependency

Fields should cover:

- processTemplateId
- requiredProcessTemplateId
- requiredResult
- isRequired
- applicabilityRule

Example:

- Pneumatic Bottom Test requires Oil Leak Test passed.
- Hydrotest Shell requires Pneumatic Bottom Test passed.
- Pneumatic Roof Test requires Hydrotest Shell passed.
- Pneumatic Roof Test should not directly duplicate Pneumatic Bottom Test dependency if Hydrotest Shell already requires it.

Required endpoints:

## Companies

```txt
POST   /api/v1/companies
GET    /api/v1/companies
GET    /api/v1/companies/:id
PATCH  /api/v1/companies/:id
DELETE /api/v1/companies/:id
```

## Reference Documents

```txt
POST   /api/v1/reference-documents
GET    /api/v1/reference-documents
GET    /api/v1/reference-documents/:id
PATCH  /api/v1/reference-documents/:id
DELETE /api/v1/reference-documents/:id
```

## Acceptance Criteria

```txt
POST   /api/v1/acceptance-criteria
GET    /api/v1/acceptance-criteria
GET    /api/v1/acceptance-criteria/:id
PATCH  /api/v1/acceptance-criteria/:id
DELETE /api/v1/acceptance-criteria/:id
```

## Criteria References

Can be nested or standalone:

```txt
POST   /api/v1/acceptance-criteria/:criteriaId/references
GET    /api/v1/acceptance-criteria/:criteriaId/references
DELETE /api/v1/acceptance-criteria/:criteriaId/references/:id
```

## Process Templates

```txt
POST   /api/v1/process-templates
GET    /api/v1/process-templates
GET    /api/v1/process-templates/:id
PATCH  /api/v1/process-templates/:id
DELETE /api/v1/process-templates/:id
```

## Process Criteria Templates

```txt
POST   /api/v1/process-templates/:processTemplateId/criteria
GET    /api/v1/process-templates/:processTemplateId/criteria
PATCH  /api/v1/process-template-criteria/:id
DELETE /api/v1/process-template-criteria/:id
```

## Process Dependencies

```txt
POST   /api/v1/process-templates/:processTemplateId/dependencies
GET    /api/v1/process-templates/:processTemplateId/dependencies
PATCH  /api/v1/process-dependencies/:id
DELETE /api/v1/process-dependencies/:id
```

Permission requirements:

Use permission middleware.

Example permissions:

```txt
company.read
company.create
company.update
company.delete

reference_document.read
reference_document.create
reference_document.update
reference_document.delete

acceptance_criteria.read
acceptance_criteria.create
acceptance_criteria.update
acceptance_criteria.delete

process_template.read
process_template.create
process_template.update
process_template.delete

process_dependency.read
process_dependency.create
process_dependency.update
process_dependency.delete
```

Seed data:

Add realistic master data:

1. Reference documents:
   - KAK Pertamina placeholder
   - API 650 placeholder
   - ASME IX placeholder
   - WPS placeholder
   - ITP placeholder

2. Acceptance criteria:
   - Visual weld clean from slag
   - Visual weld clean from spatter
   - No excessive undercut
   - Bottom plate overlap minimum 5 cm
   - Annular gap minimum 8 mm
   - Peaking maximum 13 mm
   - Banding maximum 13 mm
   - Butt weld gap 1.5 mm to 3 mm
   - Pneumatic pressure sample criterion if described in PRD

3. Process templates:
   - Cleaning Tank
   - Dismantling Existing Tank
   - Foundation Work
   - Bottom Plate Installation
   - Oil Leak Test
   - Pneumatic Bottom Test
   - Shell Plate Installation and Welding
   - Radiography Shell Test
   - Pneumatic Reinforcement Test
   - Hydrotest Shell
   - Hydrotest Steam Coil Pipe, optional
   - Hydrotest Inlet Outlet Pipe
   - Roof Plate Installation and Welding
   - Pneumatic Roof Test
   - Coating Inspection
   - Commissioning

4. Process criteria mappings.

5. Process dependencies.

Response format must follow Batch 1.

After implementation:

1. Run typecheck/build/lint if scripts exist.
2. Fix compile errors.
3. Provide summary:
   - files changed
   - schema changes
   - endpoints added
   - seed data added
   - permission keys added
   - commands to run
   - assumptions

Do not continue to Batch 3 until I review and approve Batch 2.

## Do not stop after planning. Implement the code for Batch 2.

# BATCH 3 — Tank Workflow, Tank Processes, Checklist, Eligibility, Inspection Request

You are continuing the backend/server project for the internal SSIE Tank Progress Monitoring web application.

Read `PRD.md`, `CLAUDE.md`, and the code generated in Batch 1 and Batch 2 before making changes.

This is BATCH 3. Focus only on tank workflow and inspection request lifecycle.

Do not implement findings, daily reports, test records, radiography, dashboard, or print/report modules yet unless required minimally for compilation.

Implement these modules:

1. Tank module
2. Tank shell course module
3. Tank process/progress module
4. Checklist result module
5. Eligibility checking service
6. Inspection request module
7. Notification hooks for inspection request events

Domain rule:

When a tank is created, the system must automatically generate tank process records from active process templates.

Generated tank processes must respect:

- sequence order
- process type
- optional process
- applicability rule
- hasSteamCoil or similar tank attributes

Tank data requirements:

Store at minimum:

- tankNo
- tankName
- diameterMm
- heightMm
- shellCourseCount
- hasSteamCoil
- contractorCompanyId
- inspectionCompanyId
- startDate
- estimatedFinishDate
- actualFinishDate
- status
- createdBy
- createdAt
- updatedAt
- deletedAt if needed

Shell course data:

- tankId
- courseNo
- thicknessMm
- plateDimension
- remarks

Tank process/progress requirements:

Each generated process must store:

- tankId
- processTemplateId
- name
- type
- sequenceOrder
- status
- result
- plannedStartDate
- actualStartDate
- actualFinishDate
- remarks

Process status enum:

```txt
NOT_STARTED
LOCKED
WAITING_REVIEW
REVIEWED
IN_PROGRESS
COMPLETED
REJECTED
NOT_APPLICABLE
```

Process result enum:

```txt
PENDING
PASSED
FAILED
NOT_APPLICABLE
```

Checklist result requirements:

Checklist results are generated from `ProcessCriteriaTemplate`.

Each checklist result should store:

- tankProcessId
- criteriaId
- status
- actualValue
- actualText
- remarks
- checkedBy
- checkedAt

Checklist status enum:

```txt
NOT_CHECKED
PASSED
FAILED
NOT_APPLICABLE
```

Eligibility checking:

Create a central eligibility service.

A process/test can start only when:

1. all required checklist criteria are passed,
2. no blocking finding is still open,
3. all required direct dependencies have passed,
4. inspection request has been reviewed by USER/Pertamina if review is required.

For Batch 3, findings module is not implemented yet. Prepare the eligibility check to include finding check, but if finding table/module is not available yet, create a clean placeholder service or TODO interface without breaking compilation. Batch 4 will complete the finding integration.

Eligibility response should be detailed.

Example:

```json
{
  "eligible": false,
  "reasons": [
    {
      "type": "CHECKLIST_NOT_PASSED",
      "message": "Visual weld clean from slag is not passed",
      "targetId": "criteria_id"
    },
    {
      "type": "DEPENDENCY_NOT_PASSED",
      "message": "Oil Leak Test must be passed first",
      "targetId": "tank_process_id"
    }
  ]
}
```

Inspection request requirements:

Inspection request is used before process/test can start.

Flow:

```txt
DRAFT
SUBMITTED
REVIEWED
REJECTED
CANCELLED
```

Rules:

- `INSPECTOR` creates/submits request.
- Backend runs eligibility check before submit.
- `USER` can mark request as `REVIEWED`.
- Do not use heavy approval wording unless PRD requires it.
- When request becomes `REVIEWED`, related tank process can move to `REVIEWED` or allow transition to `IN_PROGRESS`.
- Send notification to relevant users when request is submitted/reviewed/rejected.

Required endpoints:

## Tanks

```txt
POST   /api/v1/tanks
GET    /api/v1/tanks
GET    /api/v1/tanks/:id
PATCH  /api/v1/tanks/:id
DELETE /api/v1/tanks/:id
```

## Tank Processes

```txt
GET    /api/v1/tanks/:tankId/processes
GET    /api/v1/tank-processes/:id
PATCH  /api/v1/tank-processes/:id/status
PATCH  /api/v1/tank-processes/:id/result
GET    /api/v1/tank-processes/:id/eligibility
```

## Checklist Results

```txt
GET    /api/v1/tank-processes/:tankProcessId/checklist-results
PATCH  /api/v1/checklist-results/:id
POST   /api/v1/tank-processes/:tankProcessId/checklist-results/generate
```

## Inspection Requests

```txt
POST   /api/v1/tank-processes/:tankProcessId/inspection-requests
GET    /api/v1/inspection-requests
GET    /api/v1/inspection-requests/:id
PATCH  /api/v1/inspection-requests/:id/submit
PATCH  /api/v1/inspection-requests/:id/review
PATCH  /api/v1/inspection-requests/:id/reject
PATCH  /api/v1/inspection-requests/:id/cancel
```

Permission requirements:

Use permission middleware.

Example permissions:

```txt
tank.read
tank.create
tank.update
tank.delete

tank_process.read
tank_process.update

checklist.read
checklist.update

inspection_request.read
inspection_request.create
inspection_request.submit
inspection_request.review
inspection_request.reject
inspection_request.cancel
```

Important direct dependency behavior:

- Pneumatic Bottom Test requires Oil Leak Test passed.
- Hydrotest Shell requires Pneumatic Bottom Test passed.
- Hydrotest Shell may also require Radiography Shell Test passed and Pneumatic Reinforcement Test passed.
- Pneumatic Roof Test should directly require Hydrotest Shell passed and Hydrotest Inlet Outlet Pipe passed.
- Pneumatic Roof Test should not directly duplicate Pneumatic Bottom Test if Hydrotest Shell already requires it.

Dashboard is not part of this batch.

Seed data:

Add sample tank:

- Tank number: TK-170
- Diameter: 36631 mm
- Height: 12778 mm
- Shell course count: 6
- Shell course thickness:
  - Course 1: 24 mm
  - Course 2: 21 mm
  - Course 3: 19 mm
  - Course 4: 14 mm
  - Course 5: 13 mm
  - Course 6: 10 mm

- Has steam coil: true
- Contractor: sample contractor from Batch 1
- Inspection company: PT Biro Klasifikasi Indonesia
- Start date and estimated finish date can use realistic sample dates.

When seeding TK-170, generate its tank processes and checklist results.

Response format must follow Batch 1.

After implementation:

1. Run typecheck/build/lint if scripts exist.
2. Fix compile errors.
3. Provide summary:
   - files changed
   - schema changes
   - endpoints added
   - seed data added
   - permission keys added
   - eligibility behavior
   - commands to run
   - assumptions

Do not continue to Batch 4 until I review and approve Batch 3.

## Do not stop after planning. Implement the code for Batch 3.

# BATCH 4 — Findings, Daily Reports, Test Records, Radiography, Dashboard, Print Data

You are continuing the backend/server project for the internal SSIE Tank Progress Monitoring web application.

Read `PRD.md`, `CLAUDE.md`, and the code generated in Batch 1, Batch 2, and Batch 3 before making changes.

This is BATCH 4. Complete the remaining operational backend modules.

Implement these modules:

1. Finding module
2. Daily report module
3. Generic test record module
4. Radiography module
5. Dashboard module
6. Print/report data endpoints
7. Complete notification integration
8. Complete file attachment integration
9. Complete finding integration inside eligibility checking

Domain rules:

Finding is not a process/test.

Finding is not an acceptance criteria.

Finding is an actual field issue that may be linked to:

- tank
- tank process
- acceptance criteria
- attachments

Finding examples:

- slag remaining on weld joint
- bottom plate overlap below requirement
- excessive spatter
- undercut indication
- peaking above limit

Finding status enum:

```txt
OPEN
IN_REPAIR
REPAIRED
VERIFIED
CLOSED
REJECTED
```

Open blocking findings must prevent process/test start.

Daily report requirements:

Inspector creates daily activity/report.

Fields should support:

- tankId
- tankProcessId
- reportDate
- activityType
- description
- inspectorId
- pertaminaPicId
- attachments/photos
- createdAt
- updatedAt

Activity type examples:

```txt
MONITORING
INSPECTION
FINDING
TEST_ACTIVITY
REPAIR_ACTIVITY
INFORMATION
```

Daily report flow:

1. Inspector opens app.
2. Adds daily activity.
3. Selects tank.
4. App may auto-select active process if available.
5. Inspector writes description.
6. Uploads photo attachments.
7. Report date defaults to today but editable.
8. Data can be viewed and printed by date.

Test record requirements:

Generic test record is used for non-radiography tests such as:

- Oil Leak Test
- Pneumatic Bottom Test
- Pneumatic Roof Test
- Pneumatic Reinforcement Test
- Hydrotest Shell
- Hydrotest Pipe

Fields should support:

- tankProcessId
- testDate
- testPressure
- pressureUnit
- holdingTime
- testMedium
- leakIndication
- result
- remarks
- createdBy
- attachments

Rules:

- Test record is linked to tank process.
- Completing a test record must update tank process status/result consistently.
- Do not duplicate real tests.
- One tank process may have one main test record unless PRD requires multiple attempts.

Radiography requirements:

Radiography module must support:

- radiography summary
- joint result details

Radiography summary fields:

- tankProcessId
- testDate
- area
- totalJoint
- totalShot
- totalAccepted
- totalRepair
- totalReshoot
- result
- remarks
- createdBy

Radiography joint result fields:

- radiographyTestId
- jointNo
- location
- weldType
- welderNo
- filmNo
- result
- defectType
- repairStatus
- remarks

Dashboard requirements:

Implement dashboard summary endpoint.

Dashboard should return:

- total tanks
- in progress tanks
- completed tanks
- open findings
- pending review requests
- tank progress table
- finding summary
- test summary if feasible

Print/report data endpoints:

Backend should return structured JSON for frontend print templates.

Do not generate PDF unless PRD explicitly requires backend PDF generation.

Required print data endpoints:

```txt
GET /api/v1/reports/daily-reports/:id/print-data
GET /api/v1/reports/tanks/:tankId/daily-reports/print-data?date=YYYY-MM-DD
GET /api/v1/reports/inspection-requests/:id/print-data
GET /api/v1/reports/test-records/:id/print-data
GET /api/v1/reports/radiography-tests/:id/print-data
```

Required endpoints:

## Findings

```txt
POST   /api/v1/findings
GET    /api/v1/findings
GET    /api/v1/findings/:id
PATCH  /api/v1/findings/:id
PATCH  /api/v1/findings/:id/status
DELETE /api/v1/findings/:id
```

## Daily Reports

```txt
POST   /api/v1/daily-reports
GET    /api/v1/daily-reports
GET    /api/v1/daily-reports/:id
PATCH  /api/v1/daily-reports/:id
DELETE /api/v1/daily-reports/:id
```

## Test Records

```txt
POST   /api/v1/tank-processes/:tankProcessId/test-records
GET    /api/v1/tank-processes/:tankProcessId/test-records
GET    /api/v1/test-records/:id
PATCH  /api/v1/test-records/:id
DELETE /api/v1/test-records/:id
PATCH  /api/v1/test-records/:id/complete
```

## Radiography

```txt
POST   /api/v1/tank-processes/:tankProcessId/radiography-tests
GET    /api/v1/tank-processes/:tankProcessId/radiography-tests
GET    /api/v1/radiography-tests/:id
PATCH  /api/v1/radiography-tests/:id
DELETE /api/v1/radiography-tests/:id

POST   /api/v1/radiography-tests/:radiographyTestId/joints
GET    /api/v1/radiography-tests/:radiographyTestId/joints
PATCH  /api/v1/radiography-joints/:id
DELETE /api/v1/radiography-joints/:id
```

## Dashboard

```txt
GET /api/v1/dashboard/summary
GET /api/v1/dashboard/tank-progress
GET /api/v1/dashboard/findings
GET /api/v1/dashboard/tests
```

Permission requirements:

Use permission middleware.

Example permissions:

```txt
finding.read
finding.create
finding.update
finding.close
finding.delete

daily_report.read
daily_report.create
daily_report.update
daily_report.delete
daily_report.print

test_record.read
test_record.create
test_record.update
test_record.complete
test_record.delete

radiography.read
radiography.create
radiography.update
radiography.delete

dashboard.read
report.print
```

Complete eligibility integration:

Update eligibility checking service from Batch 3 to include real finding check.

Eligibility must check:

1. all required checklist criteria passed,
2. no blocking open finding,
3. all direct dependencies passed,
4. inspection request reviewed when required.

File integration:

Allow attachments to be linked to:

- finding
- daily report
- test record
- radiography test
- radiography joint if needed

Use existing `FileStorage` model and mark files as used.

Notification integration:

Create in-app notifications for:

- new finding created
- finding status updated
- daily report created if needed
- inspection request submitted/reviewed/rejected
- test completed
- radiography repair found if needed

Response format must follow Batch 1.

After implementation:

1. Run typecheck/build/lint if scripts exist.
2. Fix compile errors.
3. Provide summary:
   - files changed
   - schema changes
   - endpoints added
   - notification events added
   - file attachment behavior
   - eligibility integration completed
   - commands to run
   - assumptions

This is the final backend implementation batch.

Do not generate frontend code.

Do not stop after planning. Implement the code for Batch 4.
