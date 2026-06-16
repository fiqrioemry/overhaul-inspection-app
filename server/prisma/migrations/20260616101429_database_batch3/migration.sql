/*
  Warnings:

  - The values [INSPECTION_REQUEST_SUBMITTED,INSPECTION_REQUEST_REVIEWED,FINDING_STATUS_CHANGED,TEST_COMPLETED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProcessStatusEnum" AS ENUM ('LOCKED', 'NOT_STARTED', 'WAITING_REVIEW', 'REVIEWED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "ChecklistStatusEnum" AS ENUM ('NOT_CHECKED', 'PASSED', 'FAILED', 'NOT_APPLICABLE');

-- CreateEnum
CREATE TYPE "FindingStatusEnum" AS ENUM ('OPEN', 'IN_REPAIR', 'REPAIRED', 'VERIFIED', 'CLOSED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SeverityEnum" AS ENUM ('LOW', 'MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "InspectionRequestStatusEnum" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DailyActivityTypeEnum" AS ENUM ('MONITORING', 'INSPECTION', 'FINDING', 'REPAIR', 'TEST_ACTIVITY', 'INFORMATION');

-- CreateEnum
CREATE TYPE "RadiographyJointResultEnum" AS ENUM ('PENDING', 'ACCEPTED', 'REPAIR', 'RESHOOT', 'REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('INSPECTION_ASSIGNED', 'INSPECTION_REMINDER', 'INSPECTION_REVIEW_REQUESTED', 'INSPECTION_REVIEWED', 'TANK_CREATED', 'PROCESS_STATUS_UPDATED', 'FINDING_CREATED', 'FINDING_STATUS_UPDATED', 'DAILY_REPORT_CREATED', 'TEST_RESULT_UPDATED', 'RADIOGRAPHY_RESULT_UPDATED', 'FILE_UPLOADED', 'USER_CREATED', 'EMAIL_VERIFICATION', 'PASSWORD_RESET');
ALTER TABLE "notification_settings" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
ALTER TYPE "ProcessType" ADD VALUE 'MATERIAL_INSPECTION';

-- CreateTable
CREATE TABLE "tanks" (
    "id" TEXT NOT NULL,
    "tank_no" TEXT NOT NULL,
    "tank_name" TEXT,
    "diameter_mm" DOUBLE PRECISION,
    "height_mm" DOUBLE PRECISION,
    "shell_course_count" INTEGER,
    "bottom_plate_dimension" TEXT,
    "has_steam_coil" BOOLEAN NOT NULL DEFAULT false,
    "contractor_company_id" TEXT,
    "inspection_company_id" TEXT,
    "start_date" DATE,
    "estimated_finish_date" DATE,
    "actual_finish_date" DATE,
    "status" "StatusEnum" NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "tanks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tank_shell_courses" (
    "id" TEXT NOT NULL,
    "tank_id" TEXT NOT NULL,
    "course_no" INTEGER NOT NULL,
    "thickness_mm" DOUBLE PRECISION,
    "plate_dimension" TEXT,
    "remarks" TEXT,

    CONSTRAINT "tank_shell_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tank_processes" (
    "id" TEXT NOT NULL,
    "tank_id" TEXT NOT NULL,
    "process_template_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProcessType" NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "status" "ProcessStatusEnum" NOT NULL DEFAULT 'LOCKED',
    "result" "ProcessResultEnum" NOT NULL DEFAULT 'PENDING',
    "planned_start_date" DATE,
    "actual_start_date" DATE,
    "actual_finish_date" DATE,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tank_processes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_results" (
    "id" TEXT NOT NULL,
    "tank_process_id" TEXT NOT NULL,
    "criteria_id" TEXT NOT NULL,
    "status" "ChecklistStatusEnum" NOT NULL DEFAULT 'NOT_CHECKED',
    "actual_value" DOUBLE PRECISION,
    "actual_text" TEXT,
    "remarks" TEXT,
    "checked_by" TEXT,
    "checked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checklist_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "findings" (
    "id" TEXT NOT NULL,
    "tank_id" TEXT NOT NULL,
    "tank_process_id" TEXT NOT NULL,
    "criteria_id" TEXT,
    "finding_no" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location_detail" TEXT,
    "status" "FindingStatusEnum" NOT NULL DEFAULT 'OPEN',
    "severity" "SeverityEnum" NOT NULL DEFAULT 'MAJOR',
    "is_blocking" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "closed_by" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "findings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_requests" (
    "id" TEXT NOT NULL,
    "tank_process_id" TEXT NOT NULL,
    "request_no" TEXT NOT NULL,
    "requested_by" TEXT,
    "reviewed_by" TEXT,
    "status" "InspectionRequestStatusEnum" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "review_notes" TEXT,
    "requested_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inspection_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "test_records" (
    "id" TEXT NOT NULL,
    "tank_process_id" TEXT NOT NULL,
    "test_date" DATE,
    "test_pressure" DOUBLE PRECISION,
    "pressure_unit" TEXT,
    "holding_time" TEXT,
    "test_medium" TEXT,
    "leak_indication" BOOLEAN,
    "result" "ProcessResultEnum" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "test_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiography_tests" (
    "id" TEXT NOT NULL,
    "tank_process_id" TEXT NOT NULL,
    "test_date" DATE,
    "area" TEXT,
    "total_joint" INTEGER NOT NULL DEFAULT 0,
    "total_shot" INTEGER NOT NULL DEFAULT 0,
    "total_accepted" INTEGER NOT NULL DEFAULT 0,
    "total_repair" INTEGER NOT NULL DEFAULT 0,
    "total_reshoot" INTEGER NOT NULL DEFAULT 0,
    "result" "ProcessResultEnum" NOT NULL DEFAULT 'PENDING',
    "remarks" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radiography_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "radiography_joint_results" (
    "id" TEXT NOT NULL,
    "radiography_test_id" TEXT NOT NULL,
    "joint_no" TEXT NOT NULL,
    "location" TEXT,
    "weld_type" TEXT,
    "welder_no" TEXT,
    "film_no" TEXT,
    "result" "RadiographyJointResultEnum" NOT NULL DEFAULT 'PENDING',
    "defect_type" TEXT,
    "repair_status" TEXT,
    "remarks" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "radiography_joint_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reports" (
    "id" TEXT NOT NULL,
    "tank_id" TEXT NOT NULL,
    "tank_process_id" TEXT,
    "report_date" DATE NOT NULL,
    "activity_type" "DailyActivityTypeEnum" NOT NULL,
    "description" TEXT NOT NULL,
    "inspector_id" TEXT,
    "pertamina_pic_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "daily_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tanks_tank_no_key" ON "tanks"("tank_no");

-- CreateIndex
CREATE INDEX "tanks_status_idx" ON "tanks"("status");

-- CreateIndex
CREATE INDEX "tanks_deleted_at_idx" ON "tanks"("deleted_at");

-- CreateIndex
CREATE INDEX "tank_shell_courses_tank_id_idx" ON "tank_shell_courses"("tank_id");

-- CreateIndex
CREATE UNIQUE INDEX "tank_shell_courses_tank_id_course_no_key" ON "tank_shell_courses"("tank_id", "course_no");

-- CreateIndex
CREATE INDEX "tank_processes_tank_id_idx" ON "tank_processes"("tank_id");

-- CreateIndex
CREATE INDEX "tank_processes_status_idx" ON "tank_processes"("status");

-- CreateIndex
CREATE INDEX "tank_processes_result_idx" ON "tank_processes"("result");

-- CreateIndex
CREATE UNIQUE INDEX "tank_processes_tank_id_process_template_id_key" ON "tank_processes"("tank_id", "process_template_id");

-- CreateIndex
CREATE INDEX "checklist_results_tank_process_id_idx" ON "checklist_results"("tank_process_id");

-- CreateIndex
CREATE INDEX "checklist_results_criteria_id_idx" ON "checklist_results"("criteria_id");

-- CreateIndex
CREATE INDEX "checklist_results_status_idx" ON "checklist_results"("status");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_results_tank_process_id_criteria_id_key" ON "checklist_results"("tank_process_id", "criteria_id");

-- CreateIndex
CREATE UNIQUE INDEX "findings_finding_no_key" ON "findings"("finding_no");

-- CreateIndex
CREATE INDEX "findings_tank_id_idx" ON "findings"("tank_id");

-- CreateIndex
CREATE INDEX "findings_tank_process_id_idx" ON "findings"("tank_process_id");

-- CreateIndex
CREATE INDEX "findings_status_idx" ON "findings"("status");

-- CreateIndex
CREATE INDEX "findings_deleted_at_idx" ON "findings"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "inspection_requests_request_no_key" ON "inspection_requests"("request_no");

-- CreateIndex
CREATE INDEX "inspection_requests_tank_process_id_idx" ON "inspection_requests"("tank_process_id");

-- CreateIndex
CREATE INDEX "inspection_requests_status_idx" ON "inspection_requests"("status");

-- CreateIndex
CREATE INDEX "test_records_tank_process_id_idx" ON "test_records"("tank_process_id");

-- CreateIndex
CREATE INDEX "test_records_result_idx" ON "test_records"("result");

-- CreateIndex
CREATE INDEX "radiography_tests_tank_process_id_idx" ON "radiography_tests"("tank_process_id");

-- CreateIndex
CREATE INDEX "radiography_tests_result_idx" ON "radiography_tests"("result");

-- CreateIndex
CREATE INDEX "radiography_joint_results_radiography_test_id_idx" ON "radiography_joint_results"("radiography_test_id");

-- CreateIndex
CREATE INDEX "daily_reports_tank_id_idx" ON "daily_reports"("tank_id");

-- CreateIndex
CREATE INDEX "daily_reports_tank_process_id_idx" ON "daily_reports"("tank_process_id");

-- CreateIndex
CREATE INDEX "daily_reports_report_date_idx" ON "daily_reports"("report_date");

-- AddForeignKey
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_contractor_company_id_fkey" FOREIGN KEY ("contractor_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_inspection_company_id_fkey" FOREIGN KEY ("inspection_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tank_shell_courses" ADD CONSTRAINT "tank_shell_courses_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tank_processes" ADD CONSTRAINT "tank_processes_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tank_processes" ADD CONSTRAINT "tank_processes_process_template_id_fkey" FOREIGN KEY ("process_template_id") REFERENCES "process_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_results" ADD CONSTRAINT "checklist_results_tank_process_id_fkey" FOREIGN KEY ("tank_process_id") REFERENCES "tank_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_results" ADD CONSTRAINT "checklist_results_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "acceptance_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_results" ADD CONSTRAINT "checklist_results_checked_by_fkey" FOREIGN KEY ("checked_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_tank_process_id_fkey" FOREIGN KEY ("tank_process_id") REFERENCES "tank_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "acceptance_criteria"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "findings" ADD CONSTRAINT "findings_closed_by_fkey" FOREIGN KEY ("closed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_tank_process_id_fkey" FOREIGN KEY ("tank_process_id") REFERENCES "tank_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_requests" ADD CONSTRAINT "inspection_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_records" ADD CONSTRAINT "test_records_tank_process_id_fkey" FOREIGN KEY ("tank_process_id") REFERENCES "tank_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "test_records" ADD CONSTRAINT "test_records_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiography_tests" ADD CONSTRAINT "radiography_tests_tank_process_id_fkey" FOREIGN KEY ("tank_process_id") REFERENCES "tank_processes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiography_tests" ADD CONSTRAINT "radiography_tests_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "radiography_joint_results" ADD CONSTRAINT "radiography_joint_results_radiography_test_id_fkey" FOREIGN KEY ("radiography_test_id") REFERENCES "radiography_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_tank_process_id_fkey" FOREIGN KEY ("tank_process_id") REFERENCES "tank_processes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reports" ADD CONSTRAINT "daily_reports_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
