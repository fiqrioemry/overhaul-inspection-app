import { Hono } from "hono";
import auth from "./auth.route";

const router = new Hono();

// init base route
router.get("/", (c) => {
  return c.json({ status: 200, message: "Hello Hono!", timestamp: new Date().toISOString() });
});

router.route("/v1/auth", auth);

export default router;
