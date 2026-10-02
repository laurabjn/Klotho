import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  calendarDaySchema,
  dayNoteSchema,
  movePlanSchema,
  planOutfitSchema,
  planRangeQuerySchema,
  planWeekSchema,
  type DayNote,
  type OutfitPlan,
  type PlanOutfitInput,
  type PlanRangeQuery,
} from '@klotho/shared';
import type { z } from 'zod';

import {
  DeletePlanUseCase,
  GetDayNoteUseCase,
  ListPlansUseCase,
  MovePlanUseCase,
  PlanOutfitUseCase,
  PlanWeekUseCase,
  RegeneratePlanUseCase,
  SaveDayNoteUseCase,
} from '../../../application/planning/planning.use-cases';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';

/** Days in the path are the user's calendar days (YYYY-MM-DD). */
const DayParam = () => Param('day', new ZodValidationPipe(calendarDaySchema));

@Controller('plans')
export class PlansController {
  constructor(
    private readonly listPlans: ListPlansUseCase,
    private readonly planOutfit: PlanOutfitUseCase,
    private readonly deletePlan: DeletePlanUseCase,
    private readonly movePlan: MovePlanUseCase,
    private readonly regeneratePlan: RegeneratePlanUseCase,
    private readonly planWeek: PlanWeekUseCase,
  ) {}

  /** The calendar: planned looks of a period, by day. */
  @Get()
  list(
    @CurrentUserId() userId: string,
    @Query(new ZodValidationPipe(planRangeQuerySchema)) query: PlanRangeQuery,
  ): Promise<OutfitPlan[]> {
    return this.listPlans.execute(userId, query);
  }

  /** "Planifier ma semaine": only the plans it created. */
  @Post('week')
  @HttpCode(200)
  week(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(planWeekSchema))
    body: z.output<typeof planWeekSchema>,
  ): Promise<OutfitPlan[]> {
    return this.planWeek.execute(userId, body);
  }

  /** Creates or replaces the day's plan. */
  @Put(':day')
  plan(
    @CurrentUserId() userId: string,
    @DayParam() day: string,
    @Body(new ZodValidationPipe(planOutfitSchema)) body: PlanOutfitInput,
  ): Promise<OutfitPlan> {
    return this.planOutfit.execute(userId, day, body.outfitId);
  }

  @Delete(':day')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @DayParam() day: string,
  ): Promise<void> {
    return this.deletePlan.execute(userId, day);
  }

  /** The moved plan, then the one it swapped with (if any). */
  @Post(':day/move')
  @HttpCode(200)
  move(
    @CurrentUserId() userId: string,
    @DayParam() day: string,
    @Body(new ZodValidationPipe(movePlanSchema))
    body: z.output<typeof movePlanSchema>,
  ): Promise<OutfitPlan[]> {
    return this.movePlan.execute(userId, day, body.toDay);
  }

  /** "Changer la tenue". */
  @Post(':day/regenerate')
  @HttpCode(200)
  regenerate(
    @CurrentUserId() userId: string,
    @DayParam() day: string,
  ): Promise<OutfitPlan> {
    return this.regeneratePlan.execute(userId, day);
  }
}

@Controller('days')
export class DayNotesController {
  constructor(
    private readonly getNote: GetDayNoteUseCase,
    private readonly saveNote: SaveDayNoteUseCase,
  ) {}

  @Get(':day/note')
  note(
    @CurrentUserId() userId: string,
    @DayParam() day: string,
  ): Promise<DayNote> {
    return this.getNote.execute(userId, day);
  }

  /** An empty text removes the note. */
  @Put(':day/note')
  save(
    @CurrentUserId() userId: string,
    @DayParam() day: string,
    @Body(new ZodValidationPipe(dayNoteSchema))
    body: z.output<typeof dayNoteSchema>,
  ): Promise<DayNote> {
    return this.saveNote.execute(userId, day, body.text);
  }
}
