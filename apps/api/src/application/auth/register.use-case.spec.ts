import { EmailAlreadyUsedError } from '../../domain/users/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';

describe('RegisterUseCase', () => {
  let ctx: AuthContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  it('creates the account with a hashed password', async () => {
    await ctx.register.execute(laura);

    const stored = await ctx.users.findByEmail(laura.email);
    expect(stored?.passwordHash).toBe(`hashed:${laura.password}`);
  });

  it('stores the email normalised', async () => {
    await ctx.register.execute({ ...laura, email: '  Laura@Example.COM ' });

    expect(await ctx.users.findByEmail('laura@example.com')).not.toBeNull();
  });

  it('returns the profile without the password hash', async () => {
    const { user } = await ctx.register.execute(laura);

    expect(user).toEqual({
      id: expect.any(String),
      email: laura.email,
      firstName: 'Laura',
      bio: null,
      avatarUrl: null,
      pendingEmail: null,
      createdAt: '2026-10-01T08:00:00.000Z',
    });
    expect(user).not.toHaveProperty('passwordHash');
  });

  it('opens a session right away', async () => {
    const { tokens } = await ctx.register.execute(laura);

    expect(tokens.accessToken).toMatch(/^access:/);
    expect(tokens.refreshToken).toBeTruthy();
    expect(ctx.refreshTokens.active()).toHaveLength(1);
  });

  it('refuses an email already in use, whatever its case', async () => {
    await ctx.register.execute(laura);

    await expect(
      ctx.register.execute({ ...laura, email: 'LAURA@example.com' }),
    ).rejects.toBeInstanceOf(EmailAlreadyUsedError);
  });
});
