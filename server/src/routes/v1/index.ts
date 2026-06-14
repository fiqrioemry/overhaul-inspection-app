import { Hono } from "hono";
import auth from "./auth.route";
import user from "./user.route";
import notif from "./notification.route";
import files from "./files.route";
import companies from "./companies.route";
import referenceDocs from "./reference-documents.route";
import criteria from "./acceptance-criteria.route";
import processTemplates from "./process-templates.route";
import processTemplateCriteria from "./process-template-criteria.route";
import processDependencies from "./process-dependencies.route";
import tanks from "./tanks.route";
import tankProcesses from "./tank-processes.route";
import checklistResults from "./checklist-results.route";
import inspectionRequests from "./inspection-requests.route";

const v1 = new Hono();

v1.route("/auth", auth);
v1.route("/users", user);
v1.route("/notifications", notif);
v1.route("/files", files);
v1.route("/companies", companies);
v1.route("/reference-documents", referenceDocs);
v1.route("/acceptance-criteria", criteria);
v1.route("/process-templates", processTemplates);
v1.route("/process-template-criteria", processTemplateCriteria);
v1.route("/process-dependencies", processDependencies);
v1.route("/tanks", tanks);
v1.route("/processes", tankProcesses);
v1.route("/checklist-results", checklistResults);
v1.route("/inspection-requests", inspectionRequests);

export default v1;
