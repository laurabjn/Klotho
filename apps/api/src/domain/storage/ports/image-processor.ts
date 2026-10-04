export interface ProcessedImage {
  bytes: Uint8Array;
  contentType: 'image/jpeg';
  width: number;
  height: number;
}

/**
 * Turns an uploaded file into the stored image: checks it really is a
 * JPEG/PNG/WEBP picture, applies the camera orientation, bounds its size and
 * drops every metadata (EXIF, including the GPS position of the shot).
 */
export interface ImageProcessor {
  /** @throws InvalidImageError when the bytes are not a supported image. */
  normalize(input: Uint8Array): Promise<ProcessedImage>;
  /** A smaller copy of a normalised image (e.g. to send it to the AI). */
  shrink(image: ProcessedImage, maxSide: number): Promise<ProcessedImage>;
}

export const IMAGE_PROCESSOR = Symbol('ImageProcessor');
