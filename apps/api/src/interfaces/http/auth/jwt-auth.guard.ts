import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import {
  ACCESS_TOKEN_SERVICE,
  type AccessTokenService,
} from '../../../domain/auth/ports/access-token.service';
import type { AuthenticatedRequest } from './current-user.decorator';
import { IS_PUBLIC } from './public.decorator';

/** Registered globally: every route requires a valid access token unless marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly accessTokens: AccessTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
    const userId =
      scheme === 'Bearer' && token
        ? await this.accessTokens.verify(token)
        : null;
    if (!userId) throw new UnauthorizedException();

    request.userId = userId;
    return true;
  }
}
