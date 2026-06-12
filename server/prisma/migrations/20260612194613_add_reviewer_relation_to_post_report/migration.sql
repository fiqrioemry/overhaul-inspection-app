-- AddForeignKey
ALTER TABLE "post_reports" ADD CONSTRAINT "post_reports_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
