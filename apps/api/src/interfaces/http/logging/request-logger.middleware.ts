import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

export interface RequestLogEntry {
  requestId: string;
  method: string;
  /** The route pattern (`/outfits/:id`) when known, else the path; never the query string. */
  path: string;
  status: number;
  durationMs: number;
}

export interface RequestLogSink {
  log(message: string, entry: RequestLogEntry): void;
  error(message: string, entry: RequestLogEntry): void;
}

export interface RequestWithId extends Request {
  requestId?: string;
}

const SAFE_REQUEST_ID = /^[\w-]{8,64}$/;

/** Route pattern of the matched handler: ids and other values stay out of the logs. */
function routeOf(req: Request): string {
  const route = (req.route as { path?: unknown } | undefined)?.path;
  if (typeof route === 'string') return `${req.baseUrl}${route}`;
  return (req.originalUrl ?? req.url).split('?')[0] ?? '/';
}

/**
 * One log entry per HTTP request, once answered: method, route, status,
 * duration and a request id (also sent back as X-Request-Id). Headers,
 * cookies, bodies and query strings are never logged.
 */
export function requestLogger(
  sink: RequestLogSink,
  now: () => number = () => performance.now(),
) {
  return (req: RequestWithId, res: Response, next: NextFunction): void => {
    const started = now();
    const incoming = req.header('x-request-id');
    const requestId =
      incoming && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);

    res.on('finish', () => {
      const entry: RequestLogEntry = {
        requestId,
        method: req.method,
        path: routeOf(req),
        status: res.statusCode,
        durationMs: Math.round((now() - started) * 10) / 10,
      };
      const message = `${entry.method} ${entry.path} ${entry.status} ${entry.durationMs}ms`;
      if (entry.status >= 500) sink.error(message, entry);
      else sink.log(message, entry);
    });
    next();
  };
}
