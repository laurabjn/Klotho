import { JwtService } from '@nestjs/jwt';

import { JwtAccessTokenService } from './jwt-access-token.service';

const secret = 'test-secret-that-is-long-enough-123456';

describe('JwtAccessTokenService', () => {
  const service = new JwtAccessTokenService(secret, 900);

  it('round-trips the user id', async () => {
    const { token, expiresIn } = await service.sign('user-1');

    expect(expiresIn).toBe(900);
    await expect(service.verify(token)).resolves.toBe('user-1');
  });

  it('rejects a token signed with another secret', async () => {
    const { token } = await new JwtAccessTokenService(
      'another-secret-long-enough-000000',
      900,
    ).sign('user-1');

    await expect(service.verify(token)).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const expired = await new JwtService({ secret }).signAsync(
      { sub: 'user-1', exp: Math.floor(Date.now() / 1000) - 10 },
      { algorithm: 'HS256' },
    );

    await expect(service.verify(expired)).resolves.toBeNull();
  });

  it('rejects the "none" algorithm', async () => {
    const header = Buffer.from(
      JSON.stringify({ alg: 'none', typ: 'JWT' }),
    ).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'user-1' })).toString(
      'base64url',
    );

    await expect(service.verify(`${header}.${payload}.`)).resolves.toBeNull();
  });

  it('rejects garbage', async () => {
    await expect(service.verify('not-a-jwt')).resolves.toBeNull();
  });
});
