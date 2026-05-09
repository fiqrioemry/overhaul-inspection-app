import { Hono } from "hono";
import auth from "./auth.route";
import file from "./file.route";

const router = new Hono();

// init base route
router.get("/", (c) => {
  return c.json({ status: 200, message: "Hello Hono!", timestamp: new Date().toISOString() });
});

router.route("/v1/auth", auth);
router.route("/v1/files", file);

export default router;
