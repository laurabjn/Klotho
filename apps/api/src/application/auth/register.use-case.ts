import type { AuthSession, RegisterInput } from '@klotho/shared';

import type { PasswordHasher } from '../../domain/auth/ports/password-hasher';
import { normalizeEmail } from '../../domain/users/entities/user.entity';
import { EmailAlreadyUsedError } from '../../domain/users/errors';
import type { UserRepository } from '../../domain/users/ports/user.repository';
import { toUserProfile } from '../users/user-profile.mapper';
import type { SessionIssuer } from './session-issuer';

export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionIssuer,
  ) {}

  async execute(input: RegisterInput): Promise<AuthSession> {
    const email = normalizeEmail(input.email);
    if (await this.users.findByEmail(email)) {
      throw new EmailAlreadyUsedError();
    }

    // The repository also enforces uniqueness, for concurrent sign-ups.
    const user = await this.users.create({
      email,
      firstName: input.firstName.trim(),
      passwordHash: await this.hasher.hash(input.password),
    });

    return {
      user: toUserProfile(user),
      tokens: await this.sessions.issue(user.id),
    };
  }
}
