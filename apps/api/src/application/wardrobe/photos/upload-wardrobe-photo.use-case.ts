import { randomUUID } from 'node:crypto';

import type { UploadedPhoto } from '@klotho/shared';

import type { FileStorage } from '../../../domain/storage/ports/file-storage';
import type {
  ImageProcessor,
  ProcessedImage,
} from '../../../domain/storage/ports/image-processor';
import { buildUploadKey } from '../../../domain/storage/upload-key';

/**
 * Stores a normalised copy of the picture (JPEG, bounded size, no metadata).
 * The returned key is then attached to an item with AddWardrobePhotoUseCase.
 */
export class UploadWardrobePhotoUseCase {
  constructor(
    private readonly images: ImageProcessor,
    private readonly storage: FileStorage,
  ) {}

  async execute(userId: string, file: Uint8Array): Promise<UploadedPhoto> {
    const image = await this.images.normalize(file);
    return storeWardrobePhoto(this.storage, userId, image);
  }
}

/** Saves a normalised picture under a new key of the user. */
export async function storeWardrobePhoto(
  storage: FileStorage,
  userId: string,
  image: ProcessedImage,
): Promise<UploadedPhoto> {
  const size = { width: image.width, height: image.height };
  const key = buildUploadKey(userId, randomUUID(), size);
  await storage.put(key, image.bytes, image.contentType);
  return { key, ...size };
}
