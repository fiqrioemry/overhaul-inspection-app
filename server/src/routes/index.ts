import { Hono } from "hono";
import auth from "./auth.route";
import file from "./file.route";
import user from "./user.route";
import post from "./post.route";
import { serveStatic } from "hono/bun";

const router = new Hono();

router.get("/", (c) => {
  return c.json({ status: 200, message: "Hello from social media!", timestamp: new Date().toISOString() });
});

router.get("/health", (c) => {
  return c.json({ status: 200, message: "OK", timestamp: new Date().toISOString() });
});

router.use("/uploads/*", serveStatic({ root: "./" }));

router.route("/v1/auth", auth);
router.route("/v1/file", file);
router.route("/v1/user", user);
router.route("/v1/post", post);

export default router;
