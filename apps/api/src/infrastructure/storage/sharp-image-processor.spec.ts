import sharp from 'sharp';

import { InvalidImageError } from '../../domain/storage/errors';
import { SharpImageProcessor } from './sharp-image-processor';

const processor = new SharpImageProcessor();

function image(
  format: 'jpeg' | 'png' | 'webp' | 'gif',
  width = 400,
  height = 300,
) {
  return sharp({
    create: { width, height, channels: 4, background: '#B07869' },
  })
    .toFormat(format)
    .toBuffer();
}

describe('SharpImageProcessor', () => {
  it.each(['jpeg', 'png', 'webp'] as const)(
    'accepts %s and outputs a JPEG',
    async (format) => {
      const result = await processor.normalize(await image(format));

      expect(result).toMatchObject({
        contentType: 'image/jpeg',
        width: 400,
        height: 300,
      });
      expect((await sharp(result.bytes).metadata()).format).toBe('jpeg');
    },
  );

  it('refuses other formats, whatever the file name', async () => {
    await expect(
      processor.normalize(await image('gif')),
    ).rejects.toBeInstanceOf(InvalidImageError);
  });

  it('refuses something that is not an image', async () => {
    await expect(
      processor.normalize(
        new TextEncoder().encode('<html>not an image</html>'),
      ),
    ).rejects.toBeInstanceOf(InvalidImageError);
  });

  it('bounds the longest side to 1600 px, keeping the ratio', async () => {
    const result = await processor.normalize(await image('jpeg', 4000, 3000));

    expect(result).toMatchObject({ width: 1600, height: 1200 });
  });

  it('never enlarges a small picture', async () => {
    const result = await processor.normalize(await image('png', 200, 100));

    expect(result).toMatchObject({ width: 200, height: 100 });
  });

  it('removes the EXIF metadata (GPS position) and applies the orientation', async () => {
    const withExif = await sharp({
      create: { width: 400, height: 300, channels: 3, background: '#ffffff' },
    })
      .jpeg()
      .withMetadata({
        orientation: 6, // rotated 90°: displayed as 300 x 400
        exif: { IFD0: { Make: 'KlothoPhone' }, IFD3: { GPSLatitudeRef: 'N' } },
      })
      .toBuffer();
    expect((await sharp(withExif).metadata()).exif).toBeDefined();

    const result = await processor.normalize(withExif);
    const metadata = await sharp(result.bytes).metadata();

    expect(metadata.exif).toBeUndefined();
    expect(metadata.orientation).toBeUndefined();
    expect(result).toMatchObject({ width: 300, height: 400 });
  });
});
