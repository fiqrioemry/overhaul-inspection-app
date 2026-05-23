import v1 from "./v1";
import { Hono } from "hono";
import file from "./file.route";
import docs from "./docs.route";
import { serveStatic } from "hono/bun";

const router = new Hono();

router.get("/", (c) => {
  return c.json({
    status: 200,
    message: {
      name: "Pixel Social Media API",
      version: "3.1.2",
      description: "A simple social media API built with Hono and Bun",
      lastFeaturesImprovement: [
        "Posts now support reports with reasons and optional descriptions",
        "Added rate limiting to post-related endpoints to prevent abuse",
        "Implemented a worker to automatically take down posts that exceed the report threshold",
      ],
    },
    timestamp: new Date().toISOString(),
  });
});

router.get("/health", (c) => {
  return c.json({ status: 200, message: "OK", timestamp: new Date().toISOString() });
});

router.get("/uploads/*", serveStatic({ root: "./" }));

router.route("", file);
router.route("/v1", v1);
router.route("/docs", docs);

export default router;
