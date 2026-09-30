import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  styleProfileSchema,
  type StyleProfile,
  type StyleProfileFields,
} from '@klotho/shared';

import {
  GetStyleProfileUseCase,
  UpdateStyleProfileUseCase,
} from '../../../application/preferences/style-profile.use-cases';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';

@Controller('preferences')
export class PreferencesController {
  constructor(
    private readonly getProfile: GetStyleProfileUseCase,
    private readonly updateProfile: UpdateStyleProfileUseCase,
  ) {}

  @Get('me')
  me(@CurrentUserId() userId: string): Promise<StyleProfile> {
    return this.getProfile.execute(userId);
  }

  /** Replaces the whole profile; also completes the onboarding. */
  @Put('me')
  replace(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(styleProfileSchema)) body: StyleProfileFields,
  ): Promise<StyleProfile> {
    return this.updateProfile.execute(userId, body);
  }
}
