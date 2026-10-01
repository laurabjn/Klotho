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
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/users/ports/user.repository';
import type { AuthenticatedRequest } from './current-user.decorator';
import { IS_PUBLIC } from './public.decorator';

/** Registered globally: every route requires a valid access token unless marked @Public(). */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject(ACCESS_TOKEN_SERVICE)
    private readonly accessTokens: AccessTokenService,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
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
    // A deleted account must not keep using its last access token (up to
    // 15 minutes), e.g. to upload files nobody would ever delete.
    if (!(await this.users.findById(userId))) throw new UnauthorizedException();

    request.userId = userId;
    return true;
  }
}
