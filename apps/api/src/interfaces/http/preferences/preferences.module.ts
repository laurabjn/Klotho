import { Module } from '@nestjs/common';

import {
  GetStyleProfileUseCase,
  UpdateStyleProfileUseCase,
} from '../../../application/preferences/style-profile.use-cases';
import {
  STYLE_PROFILE_REPOSITORY,
  type StyleProfileRepository,
} from '../../../domain/preferences/ports/style-profile.repository';
import { PreferencesController } from './preferences.controller';

@Module({
  controllers: [PreferencesController],
  providers: [GetStyleProfileUseCase, UpdateStyleProfileUseCase].map(
    (UseCase) => ({
      provide: UseCase,
      inject: [STYLE_PROFILE_REPOSITORY],
      useFactory: (profiles: StyleProfileRepository) => new UseCase(profiles),
    }),
  ),
})
export class PreferencesModule {}
