import type { MiddlewareHandler } from "hono";
import type { Logger } from "./logging.js";

export function authMiddleware(accessToken: string, logger: Logger): MiddlewareHandler {
  return async (c, next) => {
    const token = c.req.query("token");

    if (!token || token !== accessToken) {
      logger.warn(`Auth failed from ${c.req.header("x-forwarded-for") ?? "unknown"}`);
      return c.json({ error: "Unauthorized" }, 401);
    }

    await next();
  };
}
