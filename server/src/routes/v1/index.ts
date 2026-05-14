import { Hono } from "hono";
import auth from "./auth.route";
import user from "./user.route";
import post from "./post.route";
import chat from "./chat.route";
import comment from "./comment.route";
import notif from "./notification.route";

const v1 = new Hono();

v1.route("/users", user);
v1.route("/auth", auth);
v1.route("/posts", post);
v1.route("/chats", chat);
v1.route("/comments", comment);
v1.route("/notifications", notif);

export default v1;
