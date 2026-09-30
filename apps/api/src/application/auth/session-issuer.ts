import { randomUUID } from 'node:crypto';

import type { AuthTokens } from '@klotho/shared';

import type { AccessTokenService } from '../../domain/auth/ports/access-token.service';
import type { RefreshTokenRepository } from '../../domain/auth/ports/refresh-token.repository';
import type { SecureTokenGenerator } from '../../domain/auth/ports/secure-token.generator';
import type { Clock } from '../../domain/shared/ports/clock';
import type { AuthSettings } from './auth-settings';

const DAY_MS = 24 * 60 * 60 * 1000;

/** Issues an access token and a refresh token, persisting only the refresh token hash. */
export class SessionIssuer {
  constructor(
    private readonly accessTokens: AccessTokenService,
    private readonly secureTokens: SecureTokenGenerator,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly clock: Clock,
    private readonly settings: AuthSettings,
  ) {}

  /** @param familyId omitted for a new login, given when rotating an existing session. */
  async issue(
    userId: string,
    familyId: string = randomUUID(),
  ): Promise<AuthTokens> {
    const refreshToken = this.secureTokens.generate();
    const expiresAt = new Date(
      this.clock.now().getTime() + this.settings.refreshTokenTtlDays * DAY_MS,
    );

    await this.refreshTokens.create({
      userId,
      familyId,
      tokenHash: this.secureTokens.hash(refreshToken),
      expiresAt,
    });
    const access = await this.accessTokens.sign(userId);

    return {
      accessToken: access.token,
      accessTokenExpiresIn: access.expiresIn,
      refreshToken,
    };
  }
}
