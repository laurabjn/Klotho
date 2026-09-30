import { InvalidRefreshTokenError } from '../../domain/auth/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';

describe('LogoutUseCase', () => {
  let ctx: AuthContext;

  beforeEach(() => {
    ctx = createAuthContext();
  });

  it('revokes the session so its refresh token no longer works', async () => {
    const { tokens } = await ctx.register.execute(laura);

    await ctx.logout.execute({ refreshToken: tokens.refreshToken });

    expect(ctx.refreshTokens.active()).toHaveLength(0);
    await expect(
      ctx.refresh.execute({ refreshToken: tokens.refreshToken }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('is idempotent and silent for an unknown token', async () => {
    await expect(
      ctx.logout.execute({ refreshToken: 'unknown' }),
    ).resolves.toBeUndefined();
  });
});
