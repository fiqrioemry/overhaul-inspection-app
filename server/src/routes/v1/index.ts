import { Hono } from "hono";
import auth from "./auth.route";
import user from "./user.route";
import notif from "./notification.route";
import files from "./files.route";

const v1 = new Hono();

v1.route("/auth", auth);
v1.route("/users", user);
v1.route("/notifications", notif);
v1.route("/files", files);

export default v1;
