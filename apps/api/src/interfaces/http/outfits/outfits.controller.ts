import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  generateOutfitsSchema,
  outfitAlternativesQuerySchema,
  outfitVariantSchema,
  recentOutfitsQuerySchema,
  replaceOutfitItemSchema,
  type GenerateOutfitsRequest,
  type Outfit,
  type OutfitAlternative,
  type OutfitRole,
} from '@klotho/shared';
import type { z } from 'zod';

import {
  CreateOutfitsUseCase,
  CreateOutfitVariantUseCase,
  GetOutfitUseCase,
  ListOutfitAlternativesUseCase,
  ListRecentOutfitsUseCase,
  ReplaceOutfitItemUseCase,
} from '../../../application/outfits/outfit.use-cases';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';

@Controller('outfits')
export class OutfitsController {
  constructor(
    private readonly createOutfits: CreateOutfitsUseCase,
    private readonly getOutfit: GetOutfitUseCase,
    private readonly listRecent: ListRecentOutfitsUseCase,
    private readonly listAlternatives: ListOutfitAlternativesUseCase,
    private readonly replaceItem: ReplaceOutfitItemUseCase,
    private readonly createVariant: CreateOutfitVariantUseCase,
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
  recent(
    @CurrentUserId() userId: string,
    @Query(new ZodValidationPipe(recentOutfitsQuerySchema))
    query: z.output<typeof recentOutfitsQuerySchema>,
  ): Promise<Outfit[]> {
    return this.listRecent.execute(userId, query.limit);
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
}
