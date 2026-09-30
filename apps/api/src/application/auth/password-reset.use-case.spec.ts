import {
  InvalidCredentialsError,
  InvalidResetTokenError,
} from '../../domain/auth/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';
import { MINUTE } from '../../testing/fakes';

function tokenFromLink(url: string | undefined): string {
  return new URL(url ?? '').searchParams.get('token') ?? '';
}

describe('Password reset (forgot + reset)', () => {
  let ctx: AuthContext;

  beforeEach(async () => {
    ctx = createAuthContext();
    await ctx.register.execute(laura);
  });

  describe('ForgotPasswordUseCase', () => {
    it('emails a reset link to a known user', async () => {
      await ctx.forgotPassword.execute({ email: laura.email });

      expect(ctx.mailer.passwordResets).toEqual([
        {
          to: laura.email,
          firstName: 'Laura',
          resetUrl: expect.stringMatching(/^klotho:\/\/reset-password\?token=/),
        },
      ]);
    });

    it('stores only the hash of the token', async () => {
      await ctx.forgotPassword.execute({ email: laura.email });
      const token = tokenFromLink(ctx.mailer.passwordResets[0]?.resetUrl);

      expect(ctx.resetTokens.tokens[0]?.tokenHash).toBe(`sha:${token}`);
    });

    it('does nothing visible for an unknown email', async () => {
      await expect(
        ctx.forgotPassword.execute({ email: 'nobody@example.com' }),
      ).resolves.toBeUndefined();
      expect(ctx.mailer.passwordResets).toHaveLength(0);
    });

    it('invalidates previous links when a new one is requested', async () => {
      await ctx.forgotPassword.execute({ email: laura.email });
      await ctx.forgotPassword.execute({ email: laura.email });
      const firstToken = tokenFromLink(ctx.mailer.passwordResets[0]?.resetUrl);

      await expect(
        ctx.resetPassword.execute({
          token: firstToken,
          password: 'NewPassword1!',
        }),
      ).rejects.toBeInstanceOf(InvalidResetTokenError);
    });
  });

  describe('ResetPasswordUseCase', () => {
    let token: string;

    beforeEach(async () => {
      await ctx.forgotPassword.execute({ email: laura.email });
      token = tokenFromLink(ctx.mailer.passwordResets[0]?.resetUrl);
    });

    it('changes the password', async () => {
      await ctx.resetPassword.execute({ token, password: 'NewPassword1!' });

      await expect(
        ctx.login.execute({ email: laura.email, password: 'NewPassword1!' }),
      ).resolves.toBeDefined();
      await expect(
        ctx.login.execute({ email: laura.email, password: laura.password }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it('cannot be used twice', async () => {
      await ctx.resetPassword.execute({ token, password: 'NewPassword1!' });

      await expect(
        ctx.resetPassword.execute({ token, password: 'OtherPassword2!' }),
      ).rejects.toBeInstanceOf(InvalidResetTokenError);
    });

    it('expires after the configured delay', async () => {
      ctx.clock.advance(61 * MINUTE);

      await expect(
        ctx.resetPassword.execute({ token, password: 'NewPassword1!' }),
      ).rejects.toBeInstanceOf(InvalidResetTokenError);
    });

    it('rejects an unknown token', async () => {
      await expect(
        ctx.resetPassword.execute({
          token: 'forged',
          password: 'NewPassword1!',
        }),
      ).rejects.toBeInstanceOf(InvalidResetTokenError);
    });

    it('signs out every device', async () => {
      await ctx.login.execute({ email: laura.email, password: laura.password });
      expect(ctx.refreshTokens.active()).toHaveLength(2);

      await ctx.resetPassword.execute({ token, password: 'NewPassword1!' });

      expect(ctx.refreshTokens.active()).toHaveLength(0);
    });
  });
});
