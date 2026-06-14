-- CreateEnum
CREATE TYPE "MasterDataStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('STANDARD', 'PROCEDURE', 'SPECIFICATION', 'WPS', 'ITP', 'PROJECT_PROCEDURE');

-- CreateEnum
CREATE TYPE "AcceptanceType" AS ENUM ('PASS_FAIL', 'NUMERIC_MIN', 'NUMERIC_MAX', 'NUMERIC_RANGE', 'TEXT', 'DEPENDENCY');

-- CreateEnum
CREATE TYPE "CriteriaSeverity" AS ENUM ('CRITICAL', 'MAJOR', 'MINOR', 'OBSERVATION');

-- CreateEnum
CREATE TYPE "ProcessType" AS ENUM ('WORK', 'INSPECTION', 'TEST', 'NDT', 'COATING', 'COMMISSIONING');

-- CreateEnum
CREATE TYPE "ProcessResultEnum" AS ENUM ('PASSED', 'FAILED', 'PENDING', 'NOT_APPLICABLE');

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "reference_documents" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "revision" TEXT,
    "issuer" TEXT,
    "file_url" TEXT,
    "status" "MasterDataStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "reference_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "acceptance_criteria" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "acceptance_type" "AcceptanceType" NOT NULL,
    "operator" TEXT,
    "min_value" DOUBLE PRECISION,
    "max_value" DOUBLE PRECISION,
    "unit" TEXT,
    "acceptance_text" TEXT,
    "method" TEXT,
    "tools" TEXT,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "severity" "CriteriaSeverity" NOT NULL DEFAULT 'MAJOR',
    "status" "MasterDataStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "acceptance_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "criteria_references" (
    "id" TEXT NOT NULL,
    "criteria_id" TEXT NOT NULL,
    "reference_document_id" TEXT NOT NULL,
    "clause" TEXT,
    "page" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "criteria_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProcessType" NOT NULL,
    "sequence_order" INTEGER NOT NULL,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "applicability_rule" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "process_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_criteria_templates" (
    "id" TEXT NOT NULL,
    "process_template_id" TEXT NOT NULL,
    "criteria_id" TEXT NOT NULL,
    "sequence_order" INTEGER NOT NULL DEFAULT 0,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "applicability_rule" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_criteria_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "process_dependencies" (
    "id" TEXT NOT NULL,
    "process_template_id" TEXT NOT NULL,
    "required_process_template_id" TEXT NOT NULL,
    "required_result" "ProcessResultEnum" NOT NULL DEFAULT 'PASSED',
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "applicability_rule" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "process_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reference_documents_code_key" ON "reference_documents"("code");

-- CreateIndex
CREATE INDEX "reference_documents_code_idx" ON "reference_documents"("code");

-- CreateIndex
CREATE INDEX "reference_documents_document_type_idx" ON "reference_documents"("document_type");

-- CreateIndex
CREATE INDEX "reference_documents_status_idx" ON "reference_documents"("status");

-- CreateIndex
CREATE INDEX "reference_documents_deleted_at_idx" ON "reference_documents"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "acceptance_criteria_code_key" ON "acceptance_criteria"("code");

-- CreateIndex
CREATE INDEX "acceptance_criteria_code_idx" ON "acceptance_criteria"("code");

-- CreateIndex
CREATE INDEX "acceptance_criteria_acceptance_type_idx" ON "acceptance_criteria"("acceptance_type");

-- CreateIndex
CREATE INDEX "acceptance_criteria_status_idx" ON "acceptance_criteria"("status");

-- CreateIndex
CREATE INDEX "acceptance_criteria_deleted_at_idx" ON "acceptance_criteria"("deleted_at");

-- CreateIndex
CREATE INDEX "criteria_references_criteria_id_idx" ON "criteria_references"("criteria_id");

-- CreateIndex
CREATE INDEX "criteria_references_reference_document_id_idx" ON "criteria_references"("reference_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "criteria_references_criteria_id_reference_document_id_key" ON "criteria_references"("criteria_id", "reference_document_id");

-- CreateIndex
CREATE UNIQUE INDEX "process_templates_code_key" ON "process_templates"("code");

-- CreateIndex
CREATE INDEX "process_templates_type_idx" ON "process_templates"("type");

-- CreateIndex
CREATE INDEX "process_templates_sequence_order_idx" ON "process_templates"("sequence_order");

-- CreateIndex
CREATE INDEX "process_templates_is_active_idx" ON "process_templates"("is_active");

-- CreateIndex
CREATE INDEX "process_templates_deleted_at_idx" ON "process_templates"("deleted_at");

-- CreateIndex
CREATE INDEX "process_criteria_templates_process_template_id_idx" ON "process_criteria_templates"("process_template_id");

-- CreateIndex
CREATE INDEX "process_criteria_templates_criteria_id_idx" ON "process_criteria_templates"("criteria_id");

-- CreateIndex
CREATE UNIQUE INDEX "process_criteria_templates_process_template_id_criteria_id_key" ON "process_criteria_templates"("process_template_id", "criteria_id");

-- CreateIndex
CREATE INDEX "process_dependencies_process_template_id_idx" ON "process_dependencies"("process_template_id");

-- CreateIndex
CREATE INDEX "process_dependencies_required_process_template_id_idx" ON "process_dependencies"("required_process_template_id");

-- CreateIndex
CREATE UNIQUE INDEX "process_dependencies_process_template_id_required_process_t_key" ON "process_dependencies"("process_template_id", "required_process_template_id");

-- CreateIndex
CREATE INDEX "companies_is_active_idx" ON "companies"("is_active");

-- AddForeignKey
ALTER TABLE "criteria_references" ADD CONSTRAINT "criteria_references_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "acceptance_criteria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "criteria_references" ADD CONSTRAINT "criteria_references_reference_document_id_fkey" FOREIGN KEY ("reference_document_id") REFERENCES "reference_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_criteria_templates" ADD CONSTRAINT "process_criteria_templates_process_template_id_fkey" FOREIGN KEY ("process_template_id") REFERENCES "process_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_criteria_templates" ADD CONSTRAINT "process_criteria_templates_criteria_id_fkey" FOREIGN KEY ("criteria_id") REFERENCES "acceptance_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_dependencies" ADD CONSTRAINT "process_dependencies_process_template_id_fkey" FOREIGN KEY ("process_template_id") REFERENCES "process_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "process_dependencies" ADD CONSTRAINT "process_dependencies_required_process_template_id_fkey" FOREIGN KEY ("required_process_template_id") REFERENCES "process_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
