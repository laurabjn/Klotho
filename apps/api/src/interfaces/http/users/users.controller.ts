import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  updateProfileSchema,
  type UpdateProfileInput,
  type UserProfile,
} from '@klotho/shared';

import { GetCurrentUserUseCase } from '../../../application/users/get-current-user.use-case';
import { UpdateProfileUseCase } from '../../../application/users/update-profile.use-case';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';

@Controller('users')
export class UsersController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserUseCase,
    private readonly updateProfile: UpdateProfileUseCase,
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
}
