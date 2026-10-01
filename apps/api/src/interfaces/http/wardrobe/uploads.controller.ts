import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { ApiErrorBody, UploadedPhoto } from '@klotho/shared';

import { UploadWardrobePhotoUseCase } from '../../../application/wardrobe/photos/upload-wardrobe-photo.use-case';
import { CurrentUserId } from '../auth/current-user.decorator';
import { RateLimit } from '../rate-limit/rate-limit.decorator';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadPhoto: UploadWardrobePhotoUseCase) {}

  /**
   * multipart/form-data with the picture in the "file" field. Size limits come
   * from the Multer options of WardrobeModule (UPLOAD_MAX_BYTES, 413 beyond).
   */
  @Post('wardrobe')
  @RateLimit('uploads')
  @UseInterceptors(FileInterceptor('file'))
  wardrobe(
    @CurrentUserId() userId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UploadedPhoto> {
    if (!file) {
      const body: ApiErrorBody = {
        statusCode: 400,
        code: 'uploads.missingFile',
      };
      throw new BadRequestException(body);
    }
    // The declared type is ignored: the content itself is checked.
    return this.uploadPhoto.execute(userId, new Uint8Array(file.buffer));
  }
}
