-- Dynamic printable clearance-form templates for inspection requests.
--
-- New table "inspection_form_templates" holds one active template per test type
-- (checklist rows, default standard & code, acceptance criteria text).
-- "inspection_requests" gains nullable columns linking a request to the template
-- that was active at creation time plus a frozen snapshot, so old printed
-- requests never change when the master template is revised later.
-- "test_records" gains a nullable JSON column for dynamic result values.

-- CreateTable
CREATE TABLE "inspection_form_templates" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "test_type" "InspectionRequestTypeEnum" NOT NULL,
    "title" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT '0',
    "default_standard_and_code" TEXT,
    "procedure_text" TEXT,
    "acceptance_criteria_text" TEXT,
    "checklist_items" JSONB NOT NULL,
    "request_fields" JSONB,
    "result_fields" JSONB,
    "print_layout" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_form_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inspection_form_templates_code_key" ON "inspection_form_templates"("code");
CREATE UNIQUE INDEX "inspection_form_templates_test_type_revision_key" ON "inspection_form_templates"("test_type", "revision");
CREATE INDEX "inspection_form_templates_test_type_idx" ON "inspection_form_templates"("test_type");
CREATE INDEX "inspection_form_templates_is_active_idx" ON "inspection_form_templates"("is_active");
CREATE INDEX "inspection_form_templates_deleted_at_idx" ON "inspection_form_templates"("deleted_at");

-- AlterTable
ALTER TABLE "inspection_requests"
    ADD COLUMN "form_template_id" TEXT,
    ADD COLUMN "form_data" JSONB,
    ADD COLUMN "form_template_snapshot" JSONB;

-- CreateIndex
CREATE INDEX "inspection_requests_form_template_id_idx" ON "inspection_requests"("form_template_id");

-- AddForeignKey
ALTER TABLE "inspection_requests"
    ADD CONSTRAINT "inspection_requests_form_template_id_fkey"
    FOREIGN KEY ("form_template_id") REFERENCES "inspection_form_templates"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "test_records" ADD COLUMN "result_data" JSONB;
