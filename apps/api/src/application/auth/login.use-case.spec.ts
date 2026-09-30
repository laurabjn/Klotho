import { InvalidCredentialsError } from '../../domain/auth/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';

describe('LoginUseCase', () => {
  let ctx: AuthContext;

  beforeEach(async () => {
    ctx = createAuthContext();
    await ctx.register.execute(laura);
  });

  it('opens a session with valid credentials', async () => {
    const session = await ctx.login.execute({
      email: laura.email,
      password: laura.password,
    });

    expect(session.user.email).toBe(laura.email);
    expect(session.tokens.accessToken).toBe(`access:${session.user.id}`);
    expect(session.tokens.refreshToken).toBeTruthy();
  });

  it('matches the email case-insensitively', async () => {
    const session = await ctx.login.execute({
      email: 'LAURA@example.com',
      password: laura.password,
    });

    expect(session.user.email).toBe(laura.email);
  });

  it('rejects a wrong password', async () => {
    await expect(
      ctx.login.execute({ email: laura.email, password: 'wrong-password1' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('rejects an unknown email with the same error', async () => {
    await expect(
      ctx.login.execute({
        email: 'nobody@example.com',
        password: laura.password,
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('still verifies a password for an unknown email (constant time)', async () => {
    ctx.hasher.verified.length = 0;

    await ctx.login
      .execute({ email: 'nobody@example.com', password: 'x' })
      .catch(() => undefined);

    expect(ctx.hasher.verified).toHaveLength(1);
  });

  it('starts a new token family per login', async () => {
    await ctx.login.execute({ email: laura.email, password: laura.password });

    const families = new Set(ctx.refreshTokens.tokens.map((t) => t.familyId));
    expect(families.size).toBe(2); // register + login
  });
});
