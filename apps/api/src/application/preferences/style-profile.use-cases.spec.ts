import { styleProfileSchema } from '@klotho/shared';

import { FixedClock } from '../../testing/fakes';
import { InMemoryStyleProfileRepository } from '../../testing/in-memory-style-profile.repository';
import {
  GetStyleProfileUseCase,
  UpdateStyleProfileUseCase,
} from './style-profile.use-cases';

describe('Style profile use cases', () => {
  let repository: InMemoryStyleProfileRepository;
  let get: GetStyleProfileUseCase;
  let update: UpdateStyleProfileUseCase;

  beforeEach(() => {
    repository = new InMemoryStyleProfileRepository(new FixedClock());
    get = new GetStyleProfileUseCase(repository);
    update = new UpdateStyleProfileUseCase(repository);
  });

  it('gives an empty profile, onboarding not done, to a new user', async () => {
    await expect(get.execute('user-1')).resolves.toMatchObject({
      preferredStyles: [],
      preferredMetals: [],
      onboardingCompleted: false,
    });
  });

  it('saving (even an empty profile) completes the onboarding', async () => {
    await update.execute('user-1', styleProfileSchema.parse({}));

    await expect(get.execute('user-1')).resolves.toMatchObject({
      onboardingCompleted: true,
    });
  });

  it('replaces the whole profile', async () => {
    await update.execute(
      'user-1',
      styleProfileSchema.parse({
        preferredStyles: ['romantic'],
        preferredMetals: ['gold'],
      }),
    );
    const profile = await update.execute(
      'user-1',
      styleProfileSchema.parse({ preferredStyles: ['chic'] }),
    );

    expect(profile).toMatchObject({
      preferredStyles: ['chic'],
      preferredMetals: [],
    });
    expect(profile).not.toHaveProperty('userId');
  });

  it('keeps profiles separate between users', async () => {
    await update.execute(
      'user-1',
      styleProfileSchema.parse({ preferredStyles: ['rock'] }),
    );

    await expect(get.execute('user-2')).resolves.toMatchObject({
      preferredStyles: [],
      onboardingCompleted: false,
    });
  });
});
