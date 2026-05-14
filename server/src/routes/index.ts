import v1 from "./v1";
import { Hono } from "hono";
import file from "./file.route";
import { serveStatic } from "hono/bun";

const router = new Hono();

router.get("/", (c) => {
  return c.json({ status: 200, message: "Hello from social media!", timestamp: new Date().toISOString() });
});

router.get("/health", (c) => {
  return c.json({ status: 200, message: "OK", timestamp: new Date().toISOString() });
});

router.get("/uploads/*", serveStatic({ root: "./" }));

router.route("", file);
router.route("/v1", v1);

export default router;
