import type { ConfirmEmailChangeInput } from '@klotho/shared';

import { InvalidEmailTokenError } from '../../domain/auth/errors';
import type { SecureTokenGenerator } from '../../domain/auth/ports/secure-token.generator';
import type { Clock } from '../../domain/shared/ports/clock';
import { EmailAlreadyUsedError } from '../../domain/users/errors';
import type { EmailChangeTokenRepository } from '../../domain/users/ports/email-change-token.repository';
import type { UserRepository } from '../../domain/users/ports/user.repository';

/**
 * Second step of an e-mail change, from the link sent to the new address.
 * Public: the link may be opened while signed out; the token is the proof.
 */
export class ConfirmEmailChangeUseCase {
  constructor(
    private readonly emailChanges: EmailChangeTokenRepository,
    private readonly users: UserRepository,
    private readonly secureTokens: SecureTokenGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: ConfirmEmailChangeInput): Promise<{ email: string }> {
    const record = await this.emailChanges.findByHash(
      this.secureTokens.hash(input.token),
    );
    if (!record || record.expiresAt <= this.clock.now()) {
      throw new InvalidEmailTokenError();
    }
    // Another account may have taken the address since the request.
    const owner = await this.users.findByEmail(record.newEmail);
    if (owner && owner.id !== record.userId) throw new EmailAlreadyUsedError();

    // Consume first (atomically), so a link can never be used twice.
    if (!(await this.emailChanges.consume(record.id))) {
      throw new InvalidEmailTokenError();
    }
    // The repository also enforces uniqueness, for concurrent sign-ups.
    const user = await this.users.updateEmail(record.userId, record.newEmail);
    await this.emailChanges.deleteAllForUser(record.userId);
    return { email: user.email };
  }
}
