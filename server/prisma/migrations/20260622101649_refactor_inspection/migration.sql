-- DropIndex
DROP INDEX "test_records_result_idx";

-- RenameIndex
ALTER INDEX "inspection_request_attachments_inspection_request_id_file_st_ke" RENAME TO "inspection_request_attachments_inspection_request_id_file_s_key";
