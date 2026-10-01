import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  generateOutfitsSchema,
  listOutfitsQuerySchema,
  markOutfitWornSchema,
  outfitAlternativesQuerySchema,
  outfitFeedbackSchema,
  outfitHistoryQuerySchema,
  outfitVariantSchema,
  replaceOutfitItemSchema,
  type GenerateOutfitsRequest,
  type ListOutfitsQuery,
  type Outfit,
  type OutfitAlternative,
  type OutfitFeedbackRequest,
  type OutfitHistoryQuery,
  type OutfitRole,
  type OutfitWear,
  type Page,
} from '@klotho/shared';
import type { z } from 'zod';

import { ListOutfitsUseCase } from '../../../application/outfits/list-outfits.use-case';
import {
  DeleteOutfitWearUseCase,
  ListOutfitHistoryUseCase,
  MarkOutfitWornUseCase,
} from '../../../application/outfits/mark-outfit-worn.use-case';
import {
  CreateOutfitsUseCase,
  CreateOutfitVariantUseCase,
  GetOutfitUseCase,
  ListOutfitAlternativesUseCase,
  ReplaceOutfitItemUseCase,
} from '../../../application/outfits/outfit.use-cases';
import {
  ClearOutfitFeedbackUseCase,
  SubmitOutfitFeedbackUseCase,
} from '../../../application/outfits/submit-outfit-feedback.use-case';
import { ToggleOutfitFavoriteUseCase } from '../../../application/outfits/toggle-outfit-favorite.use-case';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';

@Controller('outfits')
export class OutfitsController {
  constructor(
    private readonly createOutfits: CreateOutfitsUseCase,
    private readonly getOutfit: GetOutfitUseCase,
    private readonly listOutfits: ListOutfitsUseCase,
    private readonly listAlternatives: ListOutfitAlternativesUseCase,
    private readonly replaceItem: ReplaceOutfitItemUseCase,
    private readonly createVariant: CreateOutfitVariantUseCase,
    private readonly submitFeedback: SubmitOutfitFeedbackUseCase,
    private readonly clearFeedback: ClearOutfitFeedbackUseCase,
    private readonly toggleFavorite: ToggleOutfitFavoriteUseCase,
    private readonly markWorn: MarkOutfitWornUseCase,
    private readonly listHistory: ListOutfitHistoryUseCase,
    private readonly deleteWear: DeleteOutfitWearUseCase,
  ) {}

  /** The 5 looks of the day, saved. */
  @Post('generate')
  generate(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(generateOutfitsSchema))
    body: GenerateOutfitsRequest,
  ): Promise<Outfit[]> {
    return this.createOutfits.execute(userId, body);
  }

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Query(new ZodValidationPipe(listOutfitsQuerySchema))
    query: ListOutfitsQuery,
  ): Promise<Page<Outfit>> {
    return this.listOutfits.execute(userId, query);
  }

  // Before ':id', which would take "history" for a look id.
  @Get('history')
  history(
    @CurrentUserId() userId: string,
    @Query(new ZodValidationPipe(outfitHistoryQuerySchema))
    query: OutfitHistoryQuery,
  ): Promise<Page<OutfitWear>> {
    return this.listHistory.execute(userId, query);
  }

  /** Undoes a wear and the usage it added to the pieces. */
  @Delete('history/:wearId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeWear(
    @CurrentUserId() userId: string,
    @Param('wearId') wearId: string,
  ): Promise<void> {
    return this.deleteWear.execute(userId, wearId);
  }

  @Get(':id')
  one(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<Outfit> {
    return this.getOutfit.execute(userId, id);
  }

  /** Pieces that could take a role in the look, best first. */
  @Get(':id/alternatives')
  alternatives(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Query(new ZodValidationPipe(outfitAlternativesQuerySchema))
    query: { role: OutfitRole },
  ): Promise<OutfitAlternative[]> {
    return this.listAlternatives.execute(userId, id, query.role);
  }

  @Post(':id/replace-item')
  @HttpCode(200)
  replace(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(replaceOutfitItemSchema))
    body: z.output<typeof replaceOutfitItemSchema>,
  ): Promise<Outfit> {
    return this.replaceItem.execute(
      userId,
      id,
      body.role,
      body.replacementItemId,
    );
  }

  @Post(':id/variant')
  variant(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(outfitVariantSchema))
    body: z.output<typeof outfitVariantSchema>,
  ): Promise<Outfit> {
    return this.createVariant.execute(
      userId,
      id,
      body.lockedItemIds,
      body.excludeOutfitIds,
    );
  }

  /** One opinion per look: the last one wins. */
  @Post(':id/feedback')
  @HttpCode(200)
  feedback(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(outfitFeedbackSchema))
    body: OutfitFeedbackRequest,
  ): Promise<Outfit> {
    return this.submitFeedback.execute(userId, id, body);
  }

  @Delete(':id/feedback')
  removeFeedback(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<Outfit> {
    return this.clearFeedback.execute(userId, id);
  }

  @Post(':id/favorite')
  @HttpCode(200)
  addFavorite(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<Outfit> {
    return this.toggleFavorite.execute(userId, id, true);
  }

  @Delete(':id/favorite')
  removeFavorite(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<Outfit> {
    return this.toggleFavorite.execute(userId, id, false);
  }

  /** "Marquer comme portée": once per look and day. */
  @Post(':id/wear')
  @HttpCode(200)
  wear(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(markOutfitWornSchema))
    body: z.output<typeof markOutfitWornSchema>,
  ): Promise<OutfitWear> {
    return this.markWorn.execute(userId, id, body.wornOn);
  }
}
