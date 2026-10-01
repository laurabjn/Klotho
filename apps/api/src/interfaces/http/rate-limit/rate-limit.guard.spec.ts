import 'reflect-metadata';

import { HttpException, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RATE_LIMITS_KEY, RateLimitGuard } from './rate-limit.guard';
import type { RateLimitName, RateLimitSettings } from './rate-limit.settings';
import { RateLimitStore } from './rate-limit.store';

const rule = { limit: 2, ttlSeconds: 60 };
const settings: RateLimitSettings = {
  enabled: true,
  rules: {
    login: rule,
    register: rule,
    forgotPassword: rule,
    resetPassword: rule,
    refresh: rule,
    uploads: rule,
  },
};

function contextFor(
  names: RateLimitName[],
  request: { ip: string; userId?: string },
) {
  const handler = () => undefined;
  Reflect.defineMetadata(RATE_LIMITS_KEY, names, handler);
  const headers: Record<string, string> = {};
  const context = {
    getHandler: () => handler,
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => ({
        setHeader: (name: string, value: string) => (headers[name] = value),
      }),
    }),
  } as unknown as ExecutionContext;
  return { context, headers };
}

describe('RateLimitGuard', () => {
  const guard = (value = settings) =>
    new RateLimitGuard(value, new RateLimitStore(() => 0), new Reflector());

  it('answers 429 request.rateLimited with Retry-After beyond the limit', () => {
    const subject = guard();
    const login = () => contextFor(['login'], { ip: '1.1.1.1' });
    expect(subject.canActivate(login().context)).toBe(true);
    expect(subject.canActivate(login().context)).toBe(true);

    const { context, headers } = login();
    let error: unknown;
    try {
      subject.canActivate(context);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(429);
    expect((error as HttpException).getResponse()).toEqual({
      statusCode: 429,
      code: 'request.rateLimited',
    });
    expect(headers['Retry-After']).toBe('60');
  });

  it('counts per IP and per limit', () => {
    const subject = guard();
    for (let i = 0; i < 2; i++)
      subject.canActivate(contextFor(['login'], { ip: '1.1.1.1' }).context);
    expect(
      subject.canActivate(contextFor(['login'], { ip: '2.2.2.2' }).context),
    ).toBe(true);
    expect(
      subject.canActivate(contextFor(['register'], { ip: '1.1.1.1' }).context),
    ).toBe(true);
  });

  it('also counts uploads per account, whatever the IP', () => {
    const subject = guard();
    subject.canActivate(
      contextFor(['uploads'], { ip: '1.1.1.1', userId: 'u1' }).context,
    );
    subject.canActivate(
      contextFor(['uploads'], { ip: '2.2.2.2', userId: 'u1' }).context,
    );
    expect(() =>
      subject.canActivate(
        contextFor(['uploads'], { ip: '3.3.3.3', userId: 'u1' }).context,
      ),
    ).toThrow(HttpException);
  });

  it('lets everything through when disabled', () => {
    const subject = guard({ ...settings, enabled: false });
    for (let i = 0; i < 5; i++) {
      expect(
        subject.canActivate(contextFor(['login'], { ip: '1.1.1.1' }).context),
      ).toBe(true);
    }
  });
});
