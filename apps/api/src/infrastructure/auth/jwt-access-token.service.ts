import { JwtService } from '@nestjs/jwt';

import type {
  AccessToken,
  AccessTokenService,
} from '../../domain/auth/ports/access-token.service';

const ALGORITHM = 'HS256';

export class JwtAccessTokenService implements AccessTokenService {
  private readonly jwt: JwtService;

  constructor(
    secret: string,
    private readonly ttlSeconds: number,
  ) {
    this.jwt = new JwtService({ secret });
  }

  async sign(userId: string): Promise<AccessToken> {
    const token = await this.jwt.signAsync(
      { sub: userId },
      { algorithm: ALGORITHM, expiresIn: this.ttlSeconds },
    );
    return { token, expiresIn: this.ttlSeconds };
  }

  async verify(token: string): Promise<string | null> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown }>(token, {
        algorithms: [ALGORITHM],
      });
      return typeof payload.sub === 'string' ? payload.sub : null;
    } catch {
      return null;
    }
  }
}
