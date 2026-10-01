import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  InvalidResetTokenError,
} from '../../domain/auth/errors';
import {
  InvalidPasswordError,
  UserNotFoundError,
} from '../../domain/users/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';

const NEW_PASSWORD = 'NewDressing2026!';

describe('ChangePasswordUseCase', () => {
  let ctx: AuthContext;
  let userId: string;
  let oldRefreshToken: string;

  beforeEach(async () => {
    ctx = createAuthContext();
    ({
      user: { id: userId },
      tokens: { refreshToken: oldRefreshToken },
    } = await ctx.register.execute(laura));
  });

  const change = (currentPassword = laura.password) =>
    ctx.changePassword.execute(userId, {
      currentPassword,
      newPassword: NEW_PASSWORD,
    });

  it('changes the password', async () => {
    await change();

    await expect(
      ctx.login.execute({ email: laura.email, password: NEW_PASSWORD }),
    ).resolves.toBeDefined();
    await expect(
      ctx.login.execute({ email: laura.email, password: laura.password }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('answers a fresh session, like a login', async () => {
    const session = await change();

    expect(session.user).toMatchObject({ id: userId, email: laura.email });
    expect(session.tokens.accessToken).toBe(`access:${userId}`);
    await expect(
      ctx.refresh.execute({ refreshToken: session.tokens.refreshToken }),
    ).resolves.toBeDefined();
  });

  it('signs out every other device', async () => {
    const other = await ctx.login.execute({
      email: laura.email,
      password: laura.password,
    });

    await change();

    expect(ctx.refreshTokens.active()).toHaveLength(1);
    for (const refreshToken of [oldRefreshToken, other.tokens.refreshToken]) {
      await expect(
        ctx.refresh.execute({ refreshToken }),
      ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    }
  });

  it('invalidates pending reset links', async () => {
    await ctx.forgotPassword.execute({ email: laura.email });
    const token =
      new URL(ctx.mailer.passwordResets[0]!.resetUrl).searchParams.get(
        'token',
      ) ?? '';

    await change();

    await expect(
      ctx.resetPassword.execute({ token, password: 'Other2026!!' }),
    ).rejects.toBeInstanceOf(InvalidResetTokenError);
  });

  it('refuses a wrong current password and changes nothing', async () => {
    await expect(change('Wrong2026!')).rejects.toBeInstanceOf(
      InvalidPasswordError,
    );

    expect((await ctx.users.findById(userId))?.passwordHash).toBe(
      `hashed:${laura.password}`,
    );
    expect(ctx.refreshTokens.active()).toHaveLength(1);
  });

  it('fails for an account that no longer exists', async () => {
    await expect(
      ctx.changePassword.execute('missing', {
        currentPassword: laura.password,
        newPassword: NEW_PASSWORD,
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError);
  });
});
