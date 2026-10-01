import { InvalidEmailTokenError } from '../../domain/auth/errors';
import {
  EmailAlreadyUsedError,
  InvalidPasswordError,
  SameEmailError,
  UserNotFoundError,
} from '../../domain/users/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';
import { MINUTE } from '../../testing/fakes';

const NEW_EMAIL = 'laura.new@example.com';

describe('E-mail change (request + confirm)', () => {
  let ctx: AuthContext;
  let userId: string;

  beforeEach(async () => {
    ctx = createAuthContext();
    ({
      user: { id: userId },
    } = await ctx.register.execute(laura));
  });

  const request = (newEmail = NEW_EMAIL, password = laura.password) =>
    ctx.requestEmailChange.execute(userId, { newEmail, password });

  /** Token of the n-th confirmation e-mail sent. */
  const tokenOf = (n = 0) =>
    new URL(ctx.mailer.emailChanges[n]?.confirmUrl ?? '').searchParams.get(
      'token',
    ) ?? '';

  describe('RequestEmailChangeUseCase', () => {
    it('emails a confirmation link to the new address, normalised', async () => {
      const result = await request('  Laura.NEW@Example.com ');

      expect(result).toEqual({ pendingEmail: NEW_EMAIL });
      expect(ctx.mailer.emailChanges).toEqual([
        {
          to: NEW_EMAIL,
          firstName: 'Laura',
          confirmUrl: expect.stringMatching(
            /^klotho:\/\/confirm-email\?token=/,
          ),
        },
      ]);
      // Nothing changes before the confirmation.
      expect((await ctx.users.findById(userId))?.email).toBe(laura.email);
    });

    it('stores only the hash of the token, valid one hour', async () => {
      await request();

      expect(ctx.emailChanges.tokens).toEqual([
        expect.objectContaining({
          userId,
          newEmail: NEW_EMAIL,
          tokenHash: `sha:${tokenOf()}`,
          expiresAt: new Date('2026-10-01T09:00:00.000Z'),
        }),
      ]);
    });

    it('keeps one request per user: a new one replaces the previous', async () => {
      await request();
      await request('other.new@example.com');

      expect(ctx.emailChanges.tokens).toHaveLength(1);
      await expect(
        ctx.confirmEmailChange.execute({ token: tokenOf(0) }),
      ).rejects.toBeInstanceOf(InvalidEmailTokenError);
      await expect(
        ctx.confirmEmailChange.execute({ token: tokenOf(1) }),
      ).resolves.toEqual({ email: 'other.new@example.com' });
    });

    it('refuses a wrong password', async () => {
      await expect(request(NEW_EMAIL, 'Wrong2026!')).rejects.toBeInstanceOf(
        InvalidPasswordError,
      );
      expect(ctx.mailer.emailChanges).toEqual([]);
    });

    it('refuses the current address, whatever its case', async () => {
      await expect(request('LAURA@example.com')).rejects.toBeInstanceOf(
        SameEmailError,
      );
    });

    it('refuses an address used by another account', async () => {
      await ctx.register.execute({ ...laura, email: NEW_EMAIL });

      await expect(request()).rejects.toBeInstanceOf(EmailAlreadyUsedError);
      expect(ctx.mailer.emailChanges).toEqual([]);
    });

    it('fails for an account that no longer exists', async () => {
      await expect(
        ctx.requestEmailChange.execute('missing', {
          newEmail: NEW_EMAIL,
          password: laura.password,
        }),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });
  });

  describe('ConfirmEmailChangeUseCase', () => {
    beforeEach(async () => {
      await request();
    });

    it('changes the address and consumes the link', async () => {
      await expect(
        ctx.confirmEmailChange.execute({ token: tokenOf() }),
      ).resolves.toEqual({ email: NEW_EMAIL });

      expect((await ctx.users.findById(userId))?.email).toBe(NEW_EMAIL);
      expect(ctx.emailChanges.tokens).toEqual([]);
      expect((await ctx.getCurrentUser.execute(userId)).pendingEmail).toBe(
        null,
      );
      await expect(
        ctx.login.execute({ email: NEW_EMAIL, password: laura.password }),
      ).resolves.toBeDefined();
    });

    it('cannot be used twice', async () => {
      await ctx.confirmEmailChange.execute({ token: tokenOf() });

      await expect(
        ctx.confirmEmailChange.execute({ token: tokenOf() }),
      ).rejects.toBeInstanceOf(InvalidEmailTokenError);
    });

    it('expires after the configured delay', async () => {
      ctx.clock.advance(61 * MINUTE);

      await expect(
        ctx.confirmEmailChange.execute({ token: tokenOf() }),
      ).rejects.toBeInstanceOf(InvalidEmailTokenError);
      expect((await ctx.users.findById(userId))?.email).toBe(laura.email);
    });

    it('rejects an unknown token', async () => {
      await expect(
        ctx.confirmEmailChange.execute({ token: 'forged' }),
      ).rejects.toBeInstanceOf(InvalidEmailTokenError);
    });

    it('refuses when another account took the address meanwhile', async () => {
      await ctx.register.execute({ ...laura, email: NEW_EMAIL });

      await expect(
        ctx.confirmEmailChange.execute({ token: tokenOf() }),
      ).rejects.toBeInstanceOf(EmailAlreadyUsedError);
      expect((await ctx.users.findById(userId))?.email).toBe(laura.email);
    });
  });
});
