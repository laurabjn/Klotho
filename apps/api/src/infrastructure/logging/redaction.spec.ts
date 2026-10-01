import { REDACTED, redact, redactText } from './redaction';

describe('redaction', () => {
  it('masks sensitive properties at any depth', () => {
    expect(
      redact({
        email: 'laura@example.com',
        password: 'Dressing2026!',
        body: { refreshToken: 'abc', nested: [{ accessToken: 'x' }] },
        headers: { Authorization: 'Bearer abc', Cookie: 'sid=1' },
        STORAGE_SECRET_ACCESS_KEY: 'secret',
        OPENWEATHER_API_KEY: 'key',
        resetUrl: 'klotho://reset-password?token=abc',
        status: 200,
      }),
    ).toEqual({
      email: 'laura@example.com',
      password: REDACTED,
      body: { refreshToken: REDACTED, nested: [{ accessToken: REDACTED }] },
      headers: { Authorization: REDACTED, Cookie: REDACTED },
      STORAGE_SECRET_ACCESS_KEY: REDACTED,
      OPENWEATHER_API_KEY: REDACTED,
      resetUrl: REDACTED,
      status: 200,
    });
  });

  it('does not mutate the logged value', () => {
    const value = { password: 'secret' };
    redact(value);
    expect(value.password).toBe('secret');
  });

  it('scrubs tokens and signatures inside text', () => {
    expect(redactText('Authorization: Bearer abc.def-ghi')).toBe(
      `Authorization: Bearer ${REDACTED}`,
    );
    expect(
      redactText(
        'GET https://r2.dev/b/users/u/photos/a.jpg?X-Amz-Algorithm=AWS4&X-Amz-Signature=deadbeef&x=1',
      ),
    ).toBe(
      `GET https://r2.dev/b/users/u/photos/a.jpg?X-Amz-Algorithm=${REDACTED}&X-Amz-Signature=${REDACTED}&x=1`,
    );
    expect(redactText('link klotho://reset-password?token=abc123')).toBe(
      `link klotho://reset-password?token=${REDACTED}`,
    );
    expect(
      redactText('jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1In0.c2lnbmF0dXJl end'),
    ).toBe(`jwt ${REDACTED} end`);
    expect(redactText('GET /outfits/abc 200 12ms')).toBe(
      'GET /outfits/abc 200 12ms',
    );
  });

  it('scrubs error messages and stacks, keeping the error name', () => {
    const error = new TypeError('failed for ?token=abc');
    const safe = redact(error) as Error;
    expect(safe).toBeInstanceOf(Error);
    expect(safe.name).toBe('TypeError');
    expect(safe.message).toBe(`failed for ?token=${REDACTED}`);
    expect(safe.stack).not.toContain('token=abc');
  });
});
