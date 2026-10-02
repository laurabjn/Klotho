import { Module } from '@nestjs/common';

import { OutfitWorkshop } from '../../../application/outfits/outfit.use-cases';
import { DayForecasts } from '../../../application/planning/day-forecasts';
import {
  DeletePlanUseCase,
  GetDayNoteUseCase,
  ListPlansUseCase,
  MovePlanUseCase,
  PlanOutfitUseCase,
  Planner,
  PlanWeekUseCase,
  RegeneratePlanUseCase,
  SaveDayNoteUseCase,
} from '../../../application/planning/planning.use-cases';
import {
  DAY_NOTE_REPOSITORY,
  type DayNoteRepository,
} from '../../../domain/planning/ports/day-note.repository';
import {
  OUTFIT_PLAN_REPOSITORY,
  type OutfitPlanRepository,
} from '../../../domain/planning/ports/outfit-plan.repository';
import { CLOCK, type Clock } from '../../../domain/shared/ports/clock';
import {
  WEATHER_PROVIDER,
  type WeatherProvider,
} from '../../../domain/weather/ports/weather-provider';
import {
  WEATHER_SETTINGS_REPOSITORY,
  type WeatherSettingsRepository,
} from '../../../domain/weather/ports/weather-settings.repository';
import { OutfitsModule } from '../outfits/outfits.module';
import { DayNotesController, PlansController } from './planning.controller';

const planUseCases = [
  ListPlansUseCase,
  PlanOutfitUseCase,
  DeletePlanUseCase,
  MovePlanUseCase,
  RegeneratePlanUseCase,
  PlanWeekUseCase,
];

@Module({
  imports: [OutfitsModule],
  controllers: [PlansController, DayNotesController],
  providers: [
    {
      provide: Planner,
      inject: [
        OutfitWorkshop,
        OUTFIT_PLAN_REPOSITORY,
        WEATHER_PROVIDER,
        WEATHER_SETTINGS_REPOSITORY,
        CLOCK,
      ],
      useFactory: (
        workshop: OutfitWorkshop,
        plans: OutfitPlanRepository,
        provider: WeatherProvider,
        settings: WeatherSettingsRepository,
        clock: Clock,
      ) =>
        new Planner(
          workshop,
          plans,
          new DayForecasts(provider, settings),
          clock,
        ),
    },
    ...planUseCases.map((UseCase) => ({
      provide: UseCase,
      inject: [Planner],
      useFactory: (planner: Planner) => new UseCase(planner),
    })),
    ...[GetDayNoteUseCase, SaveDayNoteUseCase].map((UseCase) => ({
      provide: UseCase,
      inject: [DAY_NOTE_REPOSITORY],
      useFactory: (notes: DayNoteRepository) => new UseCase(notes),
    })),
  ],
})
export class PlanningModule {}
