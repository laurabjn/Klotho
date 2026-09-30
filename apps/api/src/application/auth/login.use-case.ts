import type { AuthSession, LoginInput } from '@klotho/shared';

import { InvalidCredentialsError } from '../../domain/auth/errors';
import type { PasswordHasher } from '../../domain/auth/ports/password-hasher';
import { normalizeEmail } from '../../domain/users/entities/user.entity';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import { toUserProfile } from '../users/user-profile.mapper';
import type { SessionIssuer } from './session-issuer';

export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionIssuer,
  ) {}

  async execute(input: LoginInput): Promise<AuthSession> {
    const user = await this.users.findByEmail(normalizeEmail(input.email));
    // Always verify, even for an unknown email, so timing does not reveal accounts.
    const passwordMatches = await this.hasher.verify(
      input.password,
      user?.passwordHash ?? null,
    );

    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }
    return {
      user: toUserProfile(user),
      tokens: await this.sessions.issue(user.id),
    };
  }
}
