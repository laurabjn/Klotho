import { Logger, Module } from '@nestjs/common';

import {
  DEFAULT_ENGINE_SETTINGS,
  OutfitGeneratorService,
} from '../../../application/outfits/outfit-generator.service';
import { ListOutfitsUseCase } from '../../../application/outfits/list-outfits.use-case';
import {
  DeleteOutfitWearUseCase,
  ListOutfitHistoryUseCase,
  MarkOutfitWornUseCase,
} from '../../../application/outfits/mark-outfit-worn.use-case';
import {
  CreateOutfitsUseCase,
  CreateOutfitVariantUseCase,
  DeleteOutfitUseCase,
  GetOutfitUseCase,
  ListOutfitAlternativesUseCase,
  OutfitWorkshop,
  ReplaceOutfitItemUseCase,
} from '../../../application/outfits/outfit.use-cases';
import {
  ClearOutfitFeedbackUseCase,
  SubmitOutfitFeedbackUseCase,
} from '../../../application/outfits/submit-outfit-feedback.use-case';
import { ToggleOutfitFavoriteUseCase } from '../../../application/outfits/toggle-outfit-favorite.use-case';
import {
  NOTIFIER,
  type Notifier,
} from '../../../domain/notifications/ports/notifier';
import {
  OUTFIT_REPOSITORY,
  type OutfitRepository,
} from '../../../domain/outfits/ports/outfit.repository';
import {
  STYLE_PROFILE_REPOSITORY,
  type StyleProfileRepository,
} from '../../../domain/preferences/ports/style-profile.repository';
import { CLOCK, type Clock } from '../../../domain/shared/ports/clock';
import {
  FILE_STORAGE,
  type FileStorage,
} from '../../../domain/storage/ports/file-storage';
import {
  WARDROBE_REPOSITORY,
  type WardrobeRepository,
} from '../../../domain/wardrobe/ports/wardrobe.repository';
import { NotificationsModule } from '../notifications/notifications.module';
import { OutfitsController } from './outfits.controller';

const logger = new Logger('OutfitEngine');

const useCases = [
  GetOutfitUseCase,
  DeleteOutfitUseCase,
  ListOutfitsUseCase,
  ListOutfitAlternativesUseCase,
  ReplaceOutfitItemUseCase,
  CreateOutfitVariantUseCase,
  SubmitOutfitFeedbackUseCase,
  ClearOutfitFeedbackUseCase,
  ToggleOutfitFavoriteUseCase,
  MarkOutfitWornUseCase,
  ListOutfitHistoryUseCase,
  DeleteOutfitWearUseCase,
];

@Module({
  imports: [NotificationsModule],
  controllers: [OutfitsController],
  providers: [
    {
      provide: OutfitWorkshop,
      inject: [
        WARDROBE_REPOSITORY,
        OUTFIT_REPOSITORY,
        STYLE_PROFILE_REPOSITORY,
        FILE_STORAGE,
        CLOCK,
      ],
      useFactory: (
        wardrobe: WardrobeRepository,
        outfits: OutfitRepository,
        profiles: StyleProfileRepository,
        storage: FileStorage,
        clock: Clock,
      ) =>
        new OutfitWorkshop(
          wardrobe,
          outfits,
          profiles,
          // The detailed score of each look, in debug logs only.
          new OutfitGeneratorService(DEFAULT_ENGINE_SETTINGS, (outfit) =>
            logger.debug(
              `${outfit.key} ${outfit.score} ${JSON.stringify(outfit.breakdown)}`,
            ),
          ),
          storage,
          clock,
        ),
    },
    ...useCases.map((UseCase) => ({
      provide: UseCase,
      inject: [OutfitWorkshop],
      useFactory: (workshop: OutfitWorkshop) => new UseCase(workshop),
    })),
    {
      provide: CreateOutfitsUseCase,
      inject: [OutfitWorkshop, NOTIFIER],
      useFactory: (workshop: OutfitWorkshop, notifier: Notifier) =>
        new CreateOutfitsUseCase(workshop, notifier),
    },
  ],
  // The planning reuses the looks and their presentation.
  exports: [OutfitWorkshop],
})
export class OutfitsModule {}
