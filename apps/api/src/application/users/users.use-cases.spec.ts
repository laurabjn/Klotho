import { updateProfileSchema } from '@klotho/shared';

import { UserNotFoundError } from '../../domain/users/errors';
import {
  createAuthContext,
  laura,
  type AuthContext,
} from '../../testing/auth-context';
import { MINUTE } from '../../testing/fakes';

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

      expect(profile).toEqual({
        id: userId,
        email: laura.email,
        firstName: 'Laura',
        bio: null,
        avatarUrl: null,
        pendingEmail: null,
        createdAt: '2026-10-01T08:00:00.000Z',
      });
      expect(profile).not.toHaveProperty('passwordHash');
    });

    it('signs the profile photo link', async () => {
      await ctx.users.updateProfile(userId, {
        avatarKey: 'users/user-1/photos/a.jpg',
      });

      const profile = await ctx.getCurrentUser.execute(userId);

      expect(profile.avatarUrl).toBe(
        'https://storage.test/users/user-1/photos/a.jpg?signature=fake',
      );
    });

    it('shows the pending e-mail change while its link is valid', async () => {
      await ctx.requestEmailChange.execute(userId, {
        newEmail: 'new@example.com',
        password: laura.password,
      });

      expect((await ctx.getCurrentUser.execute(userId)).pendingEmail).toBe(
        'new@example.com',
      );
      ctx.clock.advance(61 * MINUTE);
      expect(
        (await ctx.getCurrentUser.execute(userId)).pendingEmail,
      ).toBeNull();
    });

    it('fails for a deleted user', async () => {
      await expect(
        ctx.getCurrentUser.execute('missing'),
      ).rejects.toBeInstanceOf(UserNotFoundError);
    });
  });

  describe('UpdateProfileUseCase', () => {
    const update = (body: object) =>
      ctx.updateProfile.execute(userId, updateProfileSchema.parse(body));

    it('updates the first name and the bio', async () => {
      const profile = await update({ firstName: 'Lau', bio: '  Rétro chic  ' });

      expect(profile).toMatchObject({ firstName: 'Lau', bio: 'Rétro chic' });
    });

    it('removes the bio with an empty text or null', async () => {
      await update({ bio: 'Rétro chic' });

      expect((await update({ bio: '   ' })).bio).toBeNull();
      await update({ bio: 'Rétro chic' });
      expect((await update({ bio: null })).bio).toBeNull();
    });

    it('leaves omitted fields untouched', async () => {
      await update({ bio: 'Rétro chic' });

      const profile = await update({ firstName: 'Lau' });

      expect(profile).toMatchObject({ firstName: 'Lau', bio: 'Rétro chic' });
    });

    it('ignores the former external avatarUrl', async () => {
      const profile = await update({
        avatarUrl: 'https://cdn.klotho.app/a.png',
      });

      expect(profile.avatarUrl).toBeNull();
      expect((await ctx.users.findById(userId))?.avatarKey).toBeNull();
    });

    it('ignores fields outside the profile', async () => {
      await ctx.updateProfile.execute(userId, {
        firstName: 'Lau',
        bio: undefined,
        email: 'hacker@example.com',
      } as never);

      expect((await ctx.users.findById(userId))?.email).toBe(laura.email);
    });
  });
});
