import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  setAvatarSchema,
  updateProfileSchema,
  type AuthSession,
  type ChangeEmailInput,
  type ChangePasswordInput,
  type DeleteAccountInput,
  type SetAvatarInput,
  type UpdateProfileInput,
  type UserProfile,
} from '@klotho/shared';

import {
  RemoveAvatarUseCase,
  SetAvatarUseCase,
} from '../../../application/users/avatar.use-cases';
import { ChangePasswordUseCase } from '../../../application/users/change-password.use-case';
import { DeleteAccountUseCase } from '../../../application/users/delete-account.use-case';
import { GetCurrentUserUseCase } from '../../../application/users/get-current-user.use-case';
import { RequestEmailChangeUseCase } from '../../../application/users/request-email-change.use-case';
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
    private readonly setAvatar: SetAvatarUseCase,
    private readonly removeAvatar: RemoveAvatarUseCase,
    private readonly changePassword: ChangePasswordUseCase,
    private readonly requestEmailChange: RequestEmailChangeUseCase,
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

  /** The key of a picture uploaded with POST /uploads/wardrobe. */
  @Put('me/avatar')
  putAvatar(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(setAvatarSchema)) body: SetAvatarInput,
  ): Promise<UserProfile> {
    return this.setAvatar.execute(userId, body.key);
  }

  @Delete('me/avatar')
  deleteAvatar(@CurrentUserId() userId: string): Promise<UserProfile> {
    return this.removeAvatar.execute(userId);
  }

  /** Signs out every other device; the answer is a fresh session. */
  @Post('me/password')
  @RateLimit('login')
  @HttpCode(HttpStatus.OK)
  putPassword(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(changePasswordSchema))
    body: ChangePasswordInput,
  ): Promise<AuthSession> {
    return this.changePassword.execute(userId, body);
  }

  /** Sends a confirmation link to the new address (POST /auth/confirm-email). */
  @Post('me/email')
  @RateLimit('login', 'forgotPassword')
  @HttpCode(HttpStatus.ACCEPTED)
  postEmail(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(changeEmailSchema)) body: ChangeEmailInput,
  ): Promise<{ pendingEmail: string }> {
    return this.requestEmailChange.execute(userId, body);
  }
}
