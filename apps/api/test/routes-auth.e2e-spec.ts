import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { ModulesContainer } from '@nestjs/core';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

interface Route {
  method: string;
  path: string;
}

interface ExpressLayer {
  route?: { path: string; methods: Record<string, boolean> };
}

/** Every route the Nest router registered in Express. */
function registeredRoutes(t: TestApp): Route[] {
  const express = t.app.getHttpAdapter().getInstance() as {
    router: { stack: ExpressLayer[] };
  };
  return express.router.stack.flatMap((layer) =>
    layer.route
      ? Object.keys(layer.route.methods)
          .filter((method) => method !== '_all')
          .map((method) => ({
            method: method.toUpperCase(),
            path: layer.route!.path,
          }))
      : [],
  );
}

const joinPath = (...parts: string[]) =>
  `/${parts
    .flatMap((part) => part.split('/'))
    .filter(Boolean)
    .join('/')}`;

/** The same routes, from the controllers' decorators (cross-check). */
function declaredRoutes(t: TestApp): Route[] {
  const routes: Route[] = [];
  for (const module of t.app.get(ModulesContainer).values()) {
    for (const wrapper of module.controllers.values()) {
      const controller = wrapper.metatype as (new () => object) | null;
      if (!controller) continue;
      const base = Reflect.getMetadata(PATH_METADATA, controller) as string;
      const proto = controller.prototype as Record<string, unknown>;
      for (const name of Object.getOwnPropertyNames(proto)) {
        const handler = proto[name];
        if (name === 'constructor' || typeof handler !== 'function') continue;
        const path = Reflect.getMetadata(PATH_METADATA, handler) as
          string | undefined;
        if (path === undefined) continue;
        const method = Reflect.getMetadata(
          METHOD_METADATA,
          handler,
        ) as RequestMethod;
        routes.push({
          method: RequestMethod[method],
          path: joinPath(base, path),
        });
      }
    }
  }
  return routes;
}

/** The only routes reachable without an access token. */
const PUBLIC_ROUTES = [
  'GET /health',
  'POST /auth/register',
  'POST /auth/login',
  'POST /auth/refresh',
  // Takes the refresh token itself: works with an expired access token.
  'POST /auth/logout',
  'POST /auth/forgot-password',
  'POST /auth/reset-password',
  // The confirmation link may be opened while signed out.
  'POST /auth/confirm-email',
].sort();

const label = (route: Route) => `${route.method} ${route.path}`;
const withParams = (path: string) => path.replace(/:\w+/g, 'some-id');

describe('Authentication on every route (e2e)', () => {
  let t: TestApp;
  let routes: Route[];

  function call(route: Route, token?: string) {
    const server = request(t.app.getHttpServer());
    const path = withParams(route.path);
    const req =
      route.method === 'GET'
        ? server.get(path)
        : route.method === 'POST'
          ? server.post(path)
          : route.method === 'PUT'
            ? server.put(path)
            : route.method === 'PATCH'
              ? server.patch(path)
              : route.method === 'DELETE'
                ? server.delete(path)
                : null;
    if (!req) throw new Error(`Unexpected method ${route.method}`);
    return token ? req.set('Authorization', `Bearer ${token}`) : req;
  }

  beforeAll(async () => {
    t = await createTestApp();
    await t.reset();
    routes = registeredRoutes(t);
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('discovers the routes of every module', () => {
    const labels = routes.map(label);
    expect(labels).toEqual(
      expect.arrayContaining([
        'GET /health',
        'DELETE /users/me',
        'GET /preferences/me',
        'GET /weather/current',
        'GET /wardrobe',
        'POST /uploads/wardrobe',
        'POST /outfits/generate',
        'GET /outfits/history',
      ]),
    );
    expect(routes.map(label).sort()).toEqual(
      declaredRoutes(t).map(label).sort(),
    );
  });

  it('only exposes the expected public routes', async () => {
    const reachable: string[] = [];
    for (const route of routes) {
      const res = await call(route);
      if (res.status !== 401) reachable.push(label(route));
    }
    expect(reachable.sort()).toEqual(PUBLIC_ROUTES);
  });

  it('answers 401 auth.unauthorized without a token or with an invalid one', async () => {
    const privateRoutes = routes.filter(
      (route) => !PUBLIC_ROUTES.includes(label(route)),
    );
    for (const route of privateRoutes) {
      for (const token of [undefined, 'not-a-jwt']) {
        const res = await call(route, token);
        expect({
          route: label(route),
          status: res.status,
          body: res.body,
        }).toEqual({
          route: label(route),
          status: 401,
          body: { statusCode: 401, code: 'auth.unauthorized' },
        });
      }
    }
  });
});
