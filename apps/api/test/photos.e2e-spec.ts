import type { AuthSession, UploadedPhoto, WardrobeItem } from '@klotho/shared';
import sharp from 'sharp';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

function jpeg(width = 800, height = 600): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 3, background: '#EFCDC4' },
  })
    .jpeg()
    .withMetadata({ exif: { IFD3: { GPSLatitudeRef: 'N' } } })
    .toBuffer();
}

describe('Wardrobe photos (e2e)', () => {
  let t: TestApp;
  let laura: string;
  let other: string;
  let item: WardrobeItem;
  const http = () => request(t.app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function tokenFor(email: string): Promise<string> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: 'Dressing2026!', firstName: 'Test' })
      .expect(201);
    return (res.body as AuthSession).tokens.accessToken;
  }

  async function upload(token: string, file?: Buffer): Promise<UploadedPhoto> {
    const res = await http()
      .post('/uploads/wardrobe')
      .set(as(token))
      .attach('file', file ?? (await jpeg()), 'photo.jpg')
      .expect(201);
    return res.body as UploadedPhoto;
  }

  function attach(token: string, key: string, itemId = item.id) {
    return http()
      .post(`/wardrobe/${itemId}/photos`)
      .set(as(token))
      .send({ key });
  }

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
    laura = await tokenFor('laura@example.com');
    other = await tokenFor('other@example.com');
    const res = await http()
      .post('/wardrobe')
      .set(as(laura))
      .send({ category: 'BAG', primaryColor: 'powderPink' })
      .expect(201);
    item = res.body as WardrobeItem;
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('POST /uploads/wardrobe', () => {
    it('requires authentication', async () => {
      await http()
        .post('/uploads/wardrobe')
        .attach('file', await jpeg(), 'photo.jpg')
        .expect(401);
    });

    it('stores a normalised JPEG without EXIF metadata', async () => {
      const uploaded = await upload(laura, await jpeg(3200, 2400));

      expect(uploaded).toMatchObject({ width: 1600, height: 1200 });
      const stored = t.storage.files.get(uploaded.key)!;
      expect(stored.contentType).toBe('image/jpeg');
      expect((await sharp(stored.body).metadata()).exif).toBeUndefined();
    });

    it('415 for a file that is not a picture, whatever its name', async () => {
      const res = await http()
        .post('/uploads/wardrobe')
        .set(as(laura))
        .attach('file', Buffer.from('%PDF-1.7 not a picture'), 'photo.jpg')
        .expect(415);

      expect(res.body).toEqual({
        statusCode: 415,
        code: 'uploads.invalidImage',
      });
      expect(t.storage.files.size).toBe(0);
    });

    it('400 without a file', async () => {
      const res = await http()
        .post('/uploads/wardrobe')
        .set(as(laura))
        .expect(400);

      expect(res.body.code).toBe('uploads.missingFile');
    });
  });

  describe('POST /wardrobe/:id/photos', () => {
    it('attaches the upload; the first photo is the main one', async () => {
      const { key } = await upload(laura);

      const res = await attach(laura, key).expect(201);

      expect((res.body as WardrobeItem).photos).toEqual([
        {
          id: expect.any(String),
          url: expect.stringContaining(key),
          width: 800,
          height: 600,
          isMain: true,
        },
      ]);
    });

    it("refuses another user's upload", async () => {
      const { key } = await upload(other);

      const res = await attach(laura, key).expect(400);

      expect(res.body.code).toBe('uploads.notFound');
    });

    it("404 on another user's item", async () => {
      const { key } = await upload(other);

      await attach(other, key).expect(404);
    });

    it('409 beyond 5 photos', async () => {
      for (let i = 0; i < 5; i += 1) {
        await attach(laura, (await upload(laura)).key).expect(201);
      }

      const res = await attach(laura, (await upload(laura)).key).expect(409);
      expect(res.body.code).toBe('wardrobe.photoLimitReached');
    });

    it('the same upload cannot be attached twice', async () => {
      const { key } = await upload(laura);
      await attach(laura, key).expect(201);

      const res = await attach(laura, key).expect(400);
      expect(res.body.code).toBe('uploads.notFound');
      const photos = await t.prisma.wardrobeItemPhoto.count();
      expect(photos).toBe(1);
    });
  });

  describe('main photo and deletion', () => {
    let photos: WardrobeItem['photos'];

    beforeEach(async () => {
      await attach(laura, (await upload(laura)).key).expect(201);
      const res = await attach(laura, (await upload(laura)).key).expect(201);
      photos = (res.body as WardrobeItem).photos;
    });

    it('PATCH …/main changes the main photo, listed first', async () => {
      const res = await http()
        .patch(`/wardrobe/${item.id}/photos/${photos[1]!.id}/main`)
        .set(as(laura))
        .expect(200);

      const updated = (res.body as WardrobeItem).photos;
      expect(updated[0]).toMatchObject({ id: photos[1]!.id, isMain: true });
      expect(updated.filter((p) => p.isMain)).toHaveLength(1);
    });

    it('DELETE removes the photo and its file, the next one becomes main', async () => {
      const res = await http()
        .delete(`/wardrobe/${item.id}/photos/${photos[0]!.id}`)
        .set(as(laura))
        .expect(200);

      expect((res.body as WardrobeItem).photos).toEqual([
        expect.objectContaining({ id: photos[1]!.id, isMain: true }),
      ]);
      expect(t.storage.files.size).toBe(1);
    });

    it('another user can neither delete nor promote the photos', async () => {
      await http()
        .delete(`/wardrobe/${item.id}/photos/${photos[0]!.id}`)
        .set(as(other))
        .expect(404);
      await http()
        .patch(`/wardrobe/${item.id}/photos/${photos[1]!.id}/main`)
        .set(as(other))
        .expect(404);
      expect(t.storage.files.size).toBe(2);
    });

    it('photos appear in the list, main first', async () => {
      const res = await http().get('/wardrobe').set(as(laura)).expect(200);

      expect(res.body.items[0].photos).toHaveLength(2);
      expect(res.body.items[0].photos[0].isMain).toBe(true);
    });

    it('deleting the item deletes the photo files', async () => {
      await http().delete(`/wardrobe/${item.id}`).set(as(laura)).expect(204);

      expect(t.storage.files.size).toBe(0);
      expect(await t.prisma.wardrobeItemPhoto.count()).toBe(0);
    });
  });
});
