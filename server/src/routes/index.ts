import v1 from "./v1";
import { Hono } from "hono";

const router = new Hono();

router.get("/api/v1/health", (c) => {
  return c.json({ success: true, message: "OK", timestamp: new Date().toISOString() });
});
router.route("/api/v1", v1);

export default router;
