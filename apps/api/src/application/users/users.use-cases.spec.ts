import { UserNotFoundError } from '../../domain/users/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';

describe('Users use cases', () => {
  let ctx: AuthContext;
  let userId: string;

  beforeEach(async () => {
    ctx = createAuthContext();
    ({
      user: { id: userId },
    } = await ctx.register.execute(laura));
  });

  describe('GetCurrentUserUseCase', () => {
    it('returns the profile of the given user only', async () => {
      await ctx.register.execute({
        ...laura,
        email: 'other@example.com',
        firstName: 'Other',
      });

      const profile = await ctx.getCurrentUser.execute(userId);

      expect(profile).toMatchObject({
        id: userId,
        email: laura.email,
        firstName: 'Laura',
      });
      expect(profile).not.toHaveProperty('passwordHash');
    });

    it('fails for a deleted user', async () => {
      await expect(
        ctx.getCurrentUser.execute('missing'),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });
  });

  describe('UpdateProfileUseCase', () => {
    it('updates the allowed fields', async () => {
      const profile = await ctx.updateProfile.execute(userId, {
        firstName: 'Lau',
        avatarUrl: 'https://cdn.klotho.app/a.png',
      });

      expect(profile).toMatchObject({
        firstName: 'Lau',
        avatarUrl: 'https://cdn.klotho.app/a.png',
      });
    });

    it('leaves omitted fields untouched', async () => {
      const profile = await ctx.updateProfile.execute(userId, {
        avatarUrl: null,
      });

      expect(profile.firstName).toBe('Laura');
    });

    it('ignores fields outside the profile', async () => {
      await ctx.updateProfile.execute(userId, {
        firstName: 'Lau',
        email: 'hacker@example.com',
      } as never);

      expect((await ctx.users.findById(userId))?.email).toBe(laura.email);
    });
  });
});
