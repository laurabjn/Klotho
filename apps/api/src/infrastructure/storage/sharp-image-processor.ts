import sharp from 'sharp';

import { InvalidImageError } from '../../domain/storage/errors';
import type {
  ImageProcessor,
  ProcessedImage,
} from '../../domain/storage/ports/image-processor';

const ACCEPTED_FORMATS = new Set(['jpeg', 'png', 'webp']);
/** Longest side of stored photos: sharp on a phone, light to download. */
const MAX_SIDE = 1600;
/** Rejects "decompression bombs" before decoding them. */
const MAX_INPUT_PIXELS = 50_000_000;

export class SharpImageProcessor implements ImageProcessor {
  async normalize(input: Uint8Array): Promise<ProcessedImage> {
    // Detects the real format from the content, whatever the declared type.
    let format: string | undefined;
    try {
      format = (
        await sharp(input, { limitInputPixels: MAX_INPUT_PIXELS }).metadata()
      ).format;
    } catch {
      throw new InvalidImageError();
    }
    if (!format || !ACCEPTED_FORMATS.has(format)) throw new InvalidImageError();

    // sharp drops all metadata (EXIF, GPS…) unless asked to keep it.
    const { data, info } = await sharp(input, {
      limitInputPixels: MAX_INPUT_PIXELS,
    })
      .rotate() // apply the camera orientation before losing the EXIF tag
      .resize(MAX_SIDE, MAX_SIDE, { fit: 'inside', withoutEnlargement: true })
      .flatten({ background: '#ffffff' }) // transparent PNGs become white, not black
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    return {
      bytes: new Uint8Array(data),
      contentType: 'image/jpeg',
      width: info.width,
      height: info.height,
    };
  }
}
