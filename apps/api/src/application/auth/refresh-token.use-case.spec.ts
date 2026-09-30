import { InvalidRefreshTokenError } from '../../domain/auth/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';
import { DAY } from '../../testing/fakes';

describe('RefreshTokenUseCase', () => {
  let ctx: AuthContext;
  let refreshToken: string;

  beforeEach(async () => {
    ctx = createAuthContext();
    ({
      tokens: { refreshToken },
    } = await ctx.register.execute(laura));
  });

  it('issues a new access token and rotates the refresh token', async () => {
    const tokens = await ctx.refresh.execute({ refreshToken });

    expect(tokens.accessToken).toMatch(/^access:/);
    expect(tokens.refreshToken).not.toBe(refreshToken);
    expect(ctx.refreshTokens.active()).toHaveLength(1);
  });

  it('keeps the rotated token in the same family', async () => {
    await ctx.refresh.execute({ refreshToken });

    const [first, second] = ctx.refreshTokens.tokens;
    expect(second?.familyId).toBe(first?.familyId);
  });

  it('rejects an unknown token', async () => {
    await expect(
      ctx.refresh.execute({ refreshToken: 'forged' }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('rejects an expired token', async () => {
    ctx.clock.advance(31 * DAY);

    await expect(ctx.refresh.execute({ refreshToken })).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
  });

  it('revokes the whole family when a used token is replayed (theft detection)', async () => {
    const rotated = await ctx.refresh.execute({ refreshToken });

    await expect(ctx.refresh.execute({ refreshToken })).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
    await expect(
      ctx.refresh.execute({ refreshToken: rotated.refreshToken }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    expect(ctx.refreshTokens.active()).toHaveLength(0);
  });

  it('does not touch the sessions opened on other devices', async () => {
    await ctx.login.execute({ email: laura.email, password: laura.password });
    const rotated = await ctx.refresh.execute({ refreshToken });
    await ctx.refresh.execute({ refreshToken }).catch(() => undefined);

    expect(ctx.refreshTokens.active()).toHaveLength(1);
    expect(ctx.refreshTokens.active()[0]?.tokenHash).not.toBe(
      `sha:${rotated.refreshToken}`,
    );
  });
});
