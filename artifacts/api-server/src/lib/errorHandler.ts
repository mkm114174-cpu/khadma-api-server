import type { ErrorRequestHandler, RequestHandler } from "express";
import { logger } from "./logger";

/** Catch unhandled errors from async route handlers. */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  req.log?.error({ err }, "Unhandled route error");
  logger.error({ err, url: req.url }, "Unhandled route error");
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal Server Error" });
};

/** Express 5 does not forward rejected promises — wrap async handlers at the router level if needed. */
export function asyncHandler(
  fn: (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) => Promise<void>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res).catch(next);
  };
}
