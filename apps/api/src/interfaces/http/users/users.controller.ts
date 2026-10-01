import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  deleteAccountSchema,
  updateProfileSchema,
  type DeleteAccountInput,
  type UpdateProfileInput,
  type UserProfile,
} from '@klotho/shared';

import { DeleteAccountUseCase } from '../../../application/users/delete-account.use-case';
import { GetCurrentUserUseCase } from '../../../application/users/get-current-user.use-case';
import { UpdateProfileUseCase } from '../../../application/users/update-profile.use-case';
import { CurrentUserId } from '../auth/current-user.decorator';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';

@Controller('users')
export class UsersController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
    private readonly deleteAccount: DeleteAccountUseCase,
  ) {}

  @Get('me')
  me(@CurrentUserId() userId: string): Promise<UserProfile> {
    return this.getCurrentUser.execute(userId);
  }

  @Patch('me')
  updateMe(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
  ): Promise<UserProfile> {
    return this.updateProfile.execute(userId, body);
  }

  /** Deletes the account and all its data, files included (RGPD). */
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RateLimit('login')
  deleteMe(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(deleteAccountSchema)) body: DeleteAccountInput,
  ): Promise<void> {
    return this.deleteAccount.execute(userId, body.password);
  }
}
