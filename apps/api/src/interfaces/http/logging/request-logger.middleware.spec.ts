import { EventEmitter } from 'node:events';

import type { NextFunction, Response } from 'express';

import {
  requestLogger,
  type RequestLogEntry,
  type RequestWithId,
} from './request-logger.middleware';

function fakeExchange(request: {
  method: string;
  path: string;
  route?: string;
  headers?: Record<string, string>;
}) {
  const headers: Record<string, string> = {};
  const res = Object.assign(new EventEmitter(), {
    statusCode: 200,
    setHeader: (name: string, value: string) => {
      headers[name] = value;
    },
  });
  const req = {
    method: request.method,
    originalUrl: `${request.path}?token=secret`,
    baseUrl: '',
    route: request.route ? { path: request.route } : undefined,
    header: (name: string) => request.headers?.[name.toLowerCase()],
  };
  return {
    req: req as unknown as RequestWithId,
    res: res as unknown as Response & EventEmitter & { statusCode: number },
    headers,
  };
}

describe('requestLogger', () => {
  let logs: { level: string; message: string; entry: RequestLogEntry }[];
  let clock: number;
  let middleware: ReturnType<typeof requestLogger>;
  const next: NextFunction = jest.fn();

  beforeEach(() => {
    logs = [];
    clock = 1000;
    middleware = requestLogger(
      {
        log: (message, entry) => logs.push({ level: 'log', message, entry }),
        error: (message, entry) =>
          logs.push({ level: 'error', message, entry }),
      },
      () => clock,
    );
  });

  it('logs the route pattern, status, duration and a request id', () => {
    const { req, res, headers } = fakeExchange({
      method: 'GET',
      path: '/outfits/ck123',
      route: '/outfits/:id',
      headers: { authorization: 'Bearer secret' },
    });

    middleware(req, res, next);
    clock += 12.34;
    res.emit('finish');

    expect(logs).toEqual([
      {
        level: 'log',
        message: 'GET /outfits/:id 200 12.3ms',
        entry: {
          requestId: headers['X-Request-Id'],
          method: 'GET',
          path: '/outfits/:id',
          status: 200,
          durationMs: 12.3,
        },
      },
    ]);
    expect(JSON.stringify(logs)).not.toContain('secret');
    expect(next).toHaveBeenCalled();
  });

  it('keeps a well-formed incoming request id, replaces any other', () => {
    const kept = fakeExchange({
      method: 'GET',
      path: '/health',
      headers: { 'x-request-id': 'abc-12345678' },
    });
    middleware(kept.req, kept.res, next);
    expect(kept.headers['X-Request-Id']).toBe('abc-12345678');

    const replaced = fakeExchange({
      method: 'GET',
      path: '/health',
      headers: { 'x-request-id': 'bad id\nforged log line' },
    });
    middleware(replaced.req, replaced.res, next);
    expect(replaced.headers['X-Request-Id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('reports server errors at error level', () => {
    const { req, res } = fakeExchange({ method: 'POST', path: '/x' });
    middleware(req, res, next);
    res.statusCode = 500;
    res.emit('finish');
    expect(logs[0]?.level).toBe('error');
    // Unmatched route: the path, without the query string.
    expect(logs[0]?.entry.path).toBe('/x');
    expect(JSON.stringify(logs)).not.toContain('token');
  });
});
