import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  analyzePhotoQuerySchema,
  type AiCredits,
  type AnalyzePhotoQuery,
  type ApiErrorBody,
  type WardrobePhotoAnalysis,
} from '@klotho/shared';

import {
  AnalyzeWardrobePhotoUseCase,
  GetAiCreditsUseCase,
} from '../../../application/ai/analyze-wardrobe-photo.use-case';
import { CurrentUserId } from '../auth/current-user.decorator';
import { RateLimit } from '../rate-limit/rate-limit.decorator';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';

@Controller('ai')
export class AiController {
  constructor(
    private readonly analyzePhoto: AnalyzeWardrobePhotoUseCase,
    private readonly getCredits: GetAiCreditsUseCase,
  ) {}

  @Get('credits')
  credits(@CurrentUserId() userId: string): Promise<AiCredits> {
    return this.getCredits.execute(userId);
  }

  /**
   * Same upload as POST /uploads/wardrobe ("file" field), plus the attributes
   * the AI proposes for the piece. Uses one photo analysis of the user.
   */
  @Post('wardrobe-photo')
  @RateLimit('uploads')
  @UseInterceptors(FileInterceptor('file'))
  wardrobePhoto(
    @CurrentUserId() userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query(new ZodValidationPipe(analyzePhotoQuerySchema))
    query: AnalyzePhotoQuery,
  ): Promise<WardrobePhotoAnalysis> {
    if (!file) {
      const body: ApiErrorBody = {
        statusCode: 400,
        code: 'uploads.missingFile',
      };
      throw new BadRequestException(body);
    }
    return this.analyzePhoto.execute(
      userId,
      new Uint8Array(file.buffer),
      query.language,
    );
  }
}
