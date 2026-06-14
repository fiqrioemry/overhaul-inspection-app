import { Hono } from "hono";
import { protect } from "@/middlewares/auth.middleware";
import { requirePermission } from "@/middlewares/permission.middleware";
import { PERMISSIONS } from "@/config/constant/permission.constant";
import { ReferenceDocumentController as ctrl } from "@/modules/reference-documents/reference-document.controller";

const referenceDocs = new Hono();

referenceDocs.post("/", protect, requirePermission(PERMISSIONS.REFERENCE_DOCUMENT_CREATE), ctrl.createDocument);
referenceDocs.get("/", protect, requirePermission(PERMISSIONS.REFERENCE_DOCUMENT_READ), ctrl.listDocuments);
referenceDocs.get("/:id", protect, requirePermission(PERMISSIONS.REFERENCE_DOCUMENT_READ), ctrl.getDocumentById);
referenceDocs.patch("/:id", protect, requirePermission(PERMISSIONS.REFERENCE_DOCUMENT_UPDATE), ctrl.updateDocument);
referenceDocs.delete("/:id", protect, requirePermission(PERMISSIONS.REFERENCE_DOCUMENT_DELETE), ctrl.deleteDocument);

export default referenceDocs;
