import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { CreateWardrobeItemUseCase } from '../../../application/wardrobe/create-wardrobe-item.use-case';
import { DeleteWardrobeItemUseCase } from '../../../application/wardrobe/delete-wardrobe-item.use-case';
import { GetWardrobeItemUseCase } from '../../../application/wardrobe/get-wardrobe-item.use-case';
import { ListWardrobeItemsUseCase } from '../../../application/wardrobe/list-wardrobe-items.use-case';
import { AddWardrobePhotoUseCase } from '../../../application/wardrobe/photos/add-wardrobe-photo.use-case';
import { DeleteWardrobePhotoUseCase } from '../../../application/wardrobe/photos/delete-wardrobe-photo.use-case';
import {
  PHOTO_SETTINGS,
  type PhotoSettings,
} from '../../../application/wardrobe/photos/photo-settings';
import { SetMainWardrobePhotoUseCase } from '../../../application/wardrobe/photos/set-main-wardrobe-photo.use-case';
import { UploadWardrobePhotoUseCase } from '../../../application/wardrobe/photos/upload-wardrobe-photo.use-case';
import { SetWardrobeFavoriteUseCase } from '../../../application/wardrobe/toggle-wardrobe-favorite.use-case';
import { UpdateWardrobeItemUseCase } from '../../../application/wardrobe/update-wardrobe-item.use-case';
import type { Env } from '../../../config/env';
import {
  FILE_STORAGE,
  type FileStorage,
} from '../../../domain/storage/ports/file-storage';
import {
  IMAGE_PROCESSOR,
  type ImageProcessor,
} from '../../../domain/storage/ports/image-processor';
import {
  WARDROBE_PHOTO_REPOSITORY,
  type WardrobePhotoRepository,
} from '../../../domain/wardrobe/ports/wardrobe-photo.repository';
import {
  WARDROBE_REPOSITORY,
  type WardrobeRepository,
} from '../../../domain/wardrobe/ports/wardrobe.repository';
import { UploadsController } from './uploads.controller';
import { WardrobeController } from './wardrobe.controller';

/** Item use cases only need the repository and the storage (for photo URLs). */
const itemUseCases = [
  ListWardrobeItemsUseCase,
  CreateWardrobeItemUseCase,
  GetWardrobeItemUseCase,
  UpdateWardrobeItemUseCase,
  DeleteWardrobeItemUseCase,
  SetWardrobeFavoriteUseCase,
];

const photoUseCases = [DeleteWardrobePhotoUseCase, SetMainWardrobePhotoUseCase];

@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        // Photos are small once compressed by the app; kept in memory, never on disk.
        storage: memoryStorage(),
        limits: {
          fileSize: config.get('UPLOAD_MAX_BYTES', { infer: true }),
          files: 1,
        },
      }),
    }),
  ],
  controllers: [WardrobeController, UploadsController],
  providers: [
    ...itemUseCases.map((UseCase) => ({
      provide: UseCase,
      inject: [WARDROBE_REPOSITORY, FILE_STORAGE],
      useFactory: (wardrobe: WardrobeRepository, storage: FileStorage) =>
        new UseCase(wardrobe, storage),
    })),
    ...photoUseCases.map((UseCase) => ({
      provide: UseCase,
      inject: [WARDROBE_REPOSITORY, WARDROBE_PHOTO_REPOSITORY, FILE_STORAGE],
      useFactory: (
        wardrobe: WardrobeRepository,
        photos: WardrobePhotoRepository,
        storage: FileStorage,
      ) => new UseCase(wardrobe, photos, storage),
    })),
    {
      provide: AddWardrobePhotoUseCase,
      inject: [
        WARDROBE_REPOSITORY,
        WARDROBE_PHOTO_REPOSITORY,
        FILE_STORAGE,
        PHOTO_SETTINGS,
      ],
      useFactory: (
        wardrobe: WardrobeRepository,
        photos: WardrobePhotoRepository,
        storage: FileStorage,
        settings: PhotoSettings,
      ) => new AddWardrobePhotoUseCase(wardrobe, photos, storage, settings),
    },
    {
      provide: UploadWardrobePhotoUseCase,
      inject: [IMAGE_PROCESSOR, FILE_STORAGE],
      useFactory: (images: ImageProcessor, storage: FileStorage) =>
        new UploadWardrobePhotoUseCase(images, storage),
    },
  ],
})
export class WardrobeModule {}
