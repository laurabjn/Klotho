import type {
  ApiErrorBody,
  AuthSession,
  Outfit,
  OutfitAlternative,
  OutfitWear,
  Page,
  WardrobeItem,
} from '@klotho/shared';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

describe('Outfits (e2e)', () => {
  let t: TestApp;
  let laura: string;
  let other: string;
  const http = () => request(t.app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function tokenFor(email: string): Promise<string> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: 'Dressing2026!', firstName: 'Test' })
      .expect(201);
    return (res.body as AuthSession).tokens.accessToken;
  }

  async function add(token: string, body: object): Promise<WardrobeItem> {
    const res = await http()
      .post('/wardrobe')
      .set(as(token))
      .send(body)
      .expect(201);
    return res.body as WardrobeItem;
  }

  /** 3 tops, 3 bottoms, 2 dresses, 3 shoes, 1 layer, 1 bag. */
  async function wardrobe(token: string) {
    const piece = (category: string, name: string, extra: object = {}) =>
      add(token, { category, name, primaryColor: 'ecru', ...extra });
    return {
      blouse: await piece('TOP', 'Blouse', { styles: ['romantic'] }),
      tshirt: await piece('TOP', 'T-shirt'),
      shirt: await piece('TOP', 'Chemise'),
      jeans: await piece('BOTTOM', 'Jean', { subcategory: 'jeans' }),
      skirt: await piece('BOTTOM', 'Jupe', { subcategory: 'midiSkirt' }),
      trousers: await piece('BOTTOM', 'Pantalon', { subcategory: 'trousers' }),
      dress: await piece('DRESS', 'Robe'),
      dress2: await piece('DRESS', 'Robe noire', { primaryColor: 'black' }),
      sneakers: await piece('SHOES', 'Baskets'),
      flats: await piece('SHOES', 'Ballerines'),
      loafers: await piece('SHOES', 'Mocassins'),
      blazer: await piece('LAYER', 'Blazer', { subcategory: 'blazer' }),
      bag: await piece('BAG', 'Sac'),
      washing: await piece('TOP', 'Au lavage', { status: 'WASHING' }),
    };
  }

  async function generate(token: string, body: object = {}): Promise<Outfit[]> {
    const res = await http()
      .post('/outfits/generate')
      .set(as(token))
      .send({ temperature: 18, ...body })
      .expect(201);
    return res.body as Outfit[];
  }

  const itemIds = (outfit: Outfit) => outfit.pieces.map((p) => p.item.id);

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
    laura = await tokenFor('laura@example.com');
    other = await tokenFor('other@example.com');
  });

  afterAll(async () => {
    await t.app.close();
  });

  it.each([
    ['POST', '/outfits/generate'],
    ['GET', '/outfits'],
    ['GET', '/outfits/history'],
    ['DELETE', '/outfits/history/x'],
    ['POST', '/outfits/x/feedback'],
    ['DELETE', '/outfits/x/feedback'],
    ['POST', '/outfits/x/favorite'],
    ['DELETE', '/outfits/x/favorite'],
    ['POST', '/outfits/x/wear'],
  ])('%s %s requires authentication', async (method, path) => {
    await http()[method.toLowerCase() as 'get'](path).expect(401);
  });

  describe('POST /outfits/generate', () => {
    it('proposes 5 saved looks, with their pieces, without the raw score', async () => {
      const items = await wardrobe(laura);
      const outfits = await generate(laura, { style: 'romantic' });

      expect(outfits).toHaveLength(5);
      for (const outfit of outfits) {
        expect(outfit).not.toHaveProperty('score');
        expect(outfit.highlights.length).toBeGreaterThan(0);
        expect(outfit.pieces[0]!.item).toHaveProperty('photos');
        expect(itemIds(outfit)).not.toContain(items.washing.id);
      }
      const saved = await http()
        .get(`/outfits/${outfits[0]!.id}`)
        .set(as(laura))
        .expect(200);
      expect(saved.body).toEqual(outfits[0]);
    });

    it('keeps the mandatory piece in every look', async () => {
      const items = await wardrobe(laura);
      const outfits = await generate(laura, {
        mandatoryItemId: items.skirt.id,
      });

      for (const outfit of outfits)
        expect(itemIds(outfit)).toContain(items.skirt.id);
    });

    it('applies the exclusions and leaves out looks already seen', async () => {
      const items = await wardrobe(laura);
      const first = await generate(laura, {
        exclusions: { categories: ['DRESS'] },
      });
      for (const outfit of first)
        expect(outfit.pieces.map((p) => p.role)).not.toContain('dress');

      const again = await generate(laura, {
        excludeOutfitIds: first.map((o) => o.id),
      });
      const signature = (o: Outfit) =>
        o.pieces
          .filter((p) => !['bag', 'jewelry', 'accessory'].includes(p.role))
          .map((p) => p.item.id)
          .sort()
          .join();
      const seen = first.map(signature);
      for (const outfit of again) expect(seen).not.toContain(signature(outfit));
      expect(items).toBeDefined();
    });

    it('says when no look is possible', async () => {
      await add(laura, { category: 'TOP', primaryColor: 'white' });

      const res = await http()
        .post('/outfits/generate')
        .set(as(laura))
        .send({})
        .expect(422);
      expect((res.body as ApiErrorBody).code).toBe('outfits.noOutfitPossible');
    });

    it("refuses a mandatory piece that cannot be worn, or someone else's", async () => {
      const items = await wardrobe(laura);
      const theirs = await add(other, { category: 'TOP', primaryColor: 'red' });

      await http()
        .post('/outfits/generate')
        .set(as(laura))
        .send({ mandatoryItemId: items.washing.id })
        .expect(409);
      await http()
        .post('/outfits/generate')
        .set(as(laura))
        .send({ mandatoryItemId: theirs.id })
        .expect(400);
    });

    it('validates the request', async () => {
      await http()
        .post('/outfits/generate')
        .set(as(laura))
        .send({ occasion: 'party', temperature: 90 })
        .expect(400);
    });
  });

  async function list(token: string, query = ''): Promise<Page<Outfit>> {
    const res = await http().get(`/outfits${query}`).set(as(token)).expect(200);
    return res.body as Page<Outfit>;
  }

  async function history(token: string, query = ''): Promise<Page<OutfitWear>> {
    const res = await http()
      .get(`/outfits/history${query}`)
      .set(as(token))
      .expect(200);
    return res.body as Page<OutfitWear>;
  }

  async function wear(token: string, id: string, wornOn: string) {
    const res = await http()
      .post(`/outfits/${id}/wear`)
      .set(as(token))
      .send({ wornOn })
      .expect(200);
    return res.body as OutfitWear;
  }

  async function item(token: string, id: string): Promise<WardrobeItem> {
    const res = await http().get(`/wardrobe/${id}`).set(as(token)).expect(200);
    return res.body as WardrobeItem;
  }

  describe('GET /outfits', () => {
    it('lists the latest looks by page and keeps them private', async () => {
      await wardrobe(laura);
      const outfits = await generate(laura);

      const first = await list(laura, '?pageSize=2');
      expect(first).toMatchObject({
        total: 5,
        page: 1,
        pageSize: 2,
        hasMore: true,
      });
      expect(first.items.map((o) => o.id)).toEqual(
        outfits.slice(0, 2).map((o) => o.id),
      );
      expect(first.items[0]).toMatchObject({
        isFavorite: false,
        feedback: null,
        lastWornOn: null,
      });
      const last = await list(laura, '?filter=generated&page=3&pageSize=2');
      expect(last.items.map((o) => o.id)).toEqual([outfits[4]!.id]);
      expect(last.hasMore).toBe(false);

      await http().get(`/outfits/${outfits[0]!.id}`).set(as(other)).expect(404);
      expect(await list(other)).toMatchObject({ items: [], total: 0 });
    });

    it('lists the favourites (last favourited first) and the worn looks', async () => {
      await wardrobe(laura);
      const [a, b, c] = await generate(laura);
      for (const outfit of [b, a])
        await http()
          .post(`/outfits/${outfit!.id}/favorite`)
          .set(as(laura))
          .expect(200);
      await wear(laura, c!.id, '2026-09-20');
      await wear(laura, a!.id, '2026-09-25');

      const favorites = await list(laura, '?filter=favorites');
      expect(favorites.items.map((o) => o.id)).toEqual([a!.id, b!.id]);
      expect(favorites.total).toBe(2);

      const worn = await list(laura, '?filter=worn');
      expect(worn.items.map((o) => [o.id, o.lastWornOn])).toEqual([
        [a!.id, '2026-09-25'],
        [c!.id, '2026-09-20'],
      ]);
      expect(worn.total).toBe(2);
      expect(await list(other, '?filter=worn')).toMatchObject({ total: 0 });
    });

    it('validates the query', async () => {
      for (const query of ['?filter=mine', '?page=0', '?pageSize=51'])
        await http().get(`/outfits${query}`).set(as(laura)).expect(400);
    });
  });

  describe('favourites', () => {
    it('POST / DELETE /outfits/:id/favorite, idempotent', async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura);

      for (let i = 0; i < 2; i += 1) {
        const res = await http()
          .post(`/outfits/${outfit!.id}/favorite`)
          .set(as(laura))
          .expect(200);
        expect((res.body as Outfit).isFavorite).toBe(true);
      }
      for (let i = 0; i < 2; i += 1) {
        const res = await http()
          .delete(`/outfits/${outfit!.id}/favorite`)
          .set(as(laura))
          .expect(200);
        expect((res.body as Outfit).isFavorite).toBe(false);
      }
    });

    it("404 for another user's look", async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura);

      const res = await http()
        .post(`/outfits/${outfit!.id}/favorite`)
        .set(as(other))
        .expect(404);
      expect((res.body as ApiErrorBody).code).toBe('outfits.notFound');
      await http()
        .delete(`/outfits/${outfit!.id}/favorite`)
        .set(as(other))
        .expect(404);
      expect((await list(laura, '?filter=favorites')).total).toBe(0);
    });
  });

  describe('feedback (US8.1)', () => {
    it('saves one opinion per look; a like drops the reasons', async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura);

      const disliked = await http()
        .post(`/outfits/${outfit!.id}/feedback`)
        .set(as(laura))
        .send({ rating: 'dislike', reasons: ['shoes', 'colors'], note: 'Bof' })
        .expect(200);
      expect((disliked.body as Outfit).feedback).toEqual({
        rating: 'dislike',
        reasons: ['shoes', 'colors'],
        note: 'Bof',
        updatedAt: expect.any(String),
      });

      const liked = await http()
        .post(`/outfits/${outfit!.id}/feedback`)
        .set(as(laura))
        .send({ rating: 'like', reasons: ['shoes'] })
        .expect(200);
      expect((liked.body as Outfit).feedback).toMatchObject({
        rating: 'like',
        reasons: [],
        note: null,
      });
      expect(await t.prisma.outfitFeedback.count()).toBe(1);

      const read = await http()
        .get(`/outfits/${outfit!.id}`)
        .set(as(laura))
        .expect(200);
      expect((read.body as Outfit).feedback?.rating).toBe('like');

      for (let i = 0; i < 2; i += 1) {
        const res = await http()
          .delete(`/outfits/${outfit!.id}/feedback`)
          .set(as(laura))
          .expect(200);
        expect((res.body as Outfit).feedback).toBeNull();
      }
    });

    it('validates the opinion', async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura);

      for (const body of [
        {},
        { rating: 'meh' },
        { rating: 'dislike', reasons: ['ugly'] },
        { rating: 'like', note: 'x'.repeat(251) },
      ]) {
        const res = await http()
          .post(`/outfits/${outfit!.id}/feedback`)
          .set(as(laura))
          .send(body)
          .expect(400);
        expect((res.body as ApiErrorBody).code).toBe('validation.failed');
      }
    });

    it("404 for another user's look", async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura);

      await http()
        .post(`/outfits/${outfit!.id}/feedback`)
        .set(as(other))
        .send({ rating: 'like' })
        .expect(404);
      await http()
        .delete(`/outfits/${outfit!.id}/feedback`)
        .set(as(other))
        .expect(404);
      expect(await t.prisma.outfitFeedback.count()).toBe(0);
    });

    it('never proposes a disliked look again', async () => {
      await wardrobe(laura);
      const signature = (o: Outfit) =>
        o.pieces
          .filter((p) => !['bag', 'jewelry', 'accessory'].includes(p.role))
          .map((p) => p.item.id)
          .sort()
          .join();
      const [disliked] = await generate(laura);
      await http()
        .post(`/outfits/${disliked!.id}/feedback`)
        .set(as(laura))
        .send({ rating: 'dislike', reasons: ['association'] })
        .expect(200);

      const again = await generate(laura);
      expect(again.map(signature)).not.toContain(signature(disliked!));

      const variant = await http()
        .post(`/outfits/${again[0]!.id}/variant`)
        .send({})
        .set(as(laura))
        .expect(201);
      expect(signature(variant.body as Outfit)).not.toBe(signature(disliked!));
    });
  });

  describe('wear history', () => {
    it('marks a look worn once per day and counts the wear of every piece', async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura);
      const pieceIds = itemIds(outfit!);

      const first = await wear(laura, outfit!.id, '2026-09-30');
      expect(first).toMatchObject({
        id: expect.any(String),
        wornOn: '2026-09-30',
        outfit: { id: outfit!.id, lastWornOn: '2026-09-30' },
      });
      const again = await wear(laura, outfit!.id, '2026-09-30');
      expect(again.id).toBe(first.id);

      for (const id of pieceIds)
        expect(await item(laura, id)).toMatchObject({
          wearCount: 1,
          lastWornAt: '2026-09-30T12:00:00.000Z',
        });

      // An earlier day counts, without moving the last day back.
      await wear(laura, outfit!.id, '2026-09-01');
      for (const id of pieceIds)
        expect(await item(laura, id)).toMatchObject({
          wearCount: 2,
          lastWornAt: '2026-09-30T12:00:00.000Z',
        });
    });

    it('validates the day', async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura);

      for (const wornOn of [undefined, '30/09/2026', '2026-02-31']) {
        const res = await http()
          .post(`/outfits/${outfit!.id}/wear`)
          .set(as(laura))
          .send({ wornOn })
          .expect(400);
        expect((res.body as ApiErrorBody).code).toBe('validation.failed');
      }
    });

    it('lists the history, last worn first, filtered by period', async () => {
      await wardrobe(laura);
      const [a, b] = await generate(laura);
      await wear(laura, a!.id, '2026-09-01');
      await wear(laura, b!.id, '2026-09-15');
      await wear(laura, a!.id, '2026-09-30');

      const all = await history(laura, '?pageSize=2');
      expect(all.items.map((w) => [w.wornOn, w.outfit.id])).toEqual([
        ['2026-09-30', a!.id],
        ['2026-09-15', b!.id],
      ]);
      expect(all).toMatchObject({ total: 3, hasMore: true });

      const september = await history(laura, '?from=2026-09-01&to=2026-09-15');
      expect(september.items.map((w) => w.wornOn)).toEqual([
        '2026-09-15',
        '2026-09-01',
      ]);
      expect(await history(other)).toMatchObject({ items: [], total: 0 });

      for (const query of ['?from=2026-09-30&to=2026-09-01', '?from=yesterday'])
        await http().get(`/outfits/history${query}`).set(as(laura)).expect(400);
    });

    it('undoes a wear and the usage it added', async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura);
      const pieceIds = itemIds(outfit!);
      await wear(laura, outfit!.id, '2026-09-10');
      const last = await wear(laura, outfit!.id, '2026-09-30');

      await http()
        .delete(`/outfits/history/${last.id}`)
        .set(as(laura))
        .expect(204);
      for (const id of pieceIds)
        expect(await item(laura, id)).toMatchObject({
          wearCount: 1,
          lastWornAt: '2026-09-10T12:00:00.000Z',
        });

      const [only] = (await history(laura)).items;
      await http()
        .delete(`/outfits/history/${only!.id}`)
        .set(as(laura))
        .expect(204);
      for (const id of pieceIds)
        expect(await item(laura, id)).toMatchObject({
          wearCount: 0,
          lastWornAt: null,
        });

      const res = await http()
        .delete(`/outfits/history/${only!.id}`)
        .set(as(laura))
        .expect(404);
      expect((res.body as ApiErrorBody).code).toBe('outfits.wearNotFound');
    });

    it("cannot mark, read or undo another user's wears", async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura);
      const mine = await wear(laura, outfit!.id, '2026-09-30');

      const marked = await http()
        .post(`/outfits/${outfit!.id}/wear`)
        .set(as(other))
        .send({ wornOn: '2026-09-29' })
        .expect(404);
      expect((marked.body as ApiErrorBody).code).toBe('outfits.notFound');
      const undone = await http()
        .delete(`/outfits/history/${mine.id}`)
        .set(as(other))
        .expect(404);
      expect((undone.body as ApiErrorBody).code).toBe('outfits.wearNotFound');

      expect((await history(laura)).total).toBe(1);
      expect(await t.prisma.outfitWear.count()).toBe(1);
    });
  });

  describe('replacing a piece', () => {
    it('lists alternatives of the same role, then swaps the piece', async () => {
      const items = await wardrobe(laura);
      const [outfit] = await generate(laura, {
        exclusions: { categories: ['DRESS'] },
      });
      const shoes = outfit!.pieces.find((p) => p.role === 'shoes')!.item;

      const res = await http()
        .get(`/outfits/${outfit!.id}/alternatives?role=shoes`)
        .set(as(laura))
        .expect(200);
      const alternatives = res.body as OutfitAlternative[];
      expect(alternatives).toHaveLength(2);
      expect(alternatives.map((a) => a.item.category)).toEqual([
        'SHOES',
        'SHOES',
      ]);
      expect(alternatives.map((a) => a.item.id)).not.toContain(shoes.id);
      expect(typeof alternatives[0]!.compatible).toBe('boolean');

      const replacement = alternatives[0]!.item;
      const replaced = await http()
        .post(`/outfits/${outfit!.id}/replace-item`)
        .set(as(laura))
        .send({ role: 'shoes', replacementItemId: replacement.id })
        .expect(200);
      expect(itemIds(replaced.body as Outfit)).toContain(replacement.id);
      expect(itemIds(replaced.body as Outfit)).not.toContain(shoes.id);

      // Saved: reading it again gives the new look.
      const saved = await http()
        .get(`/outfits/${outfit!.id}`)
        .set(as(laura))
        .expect(200);
      expect(itemIds(saved.body as Outfit)).toContain(replacement.id);
      expect(items).toBeDefined();
    });

    it('refuses a piece of another kind or unavailable', async () => {
      const items = await wardrobe(laura);
      const [outfit] = await generate(laura);

      for (const replacementItemId of [items.bag.id, items.washing.id])
        await http()
          .post(`/outfits/${outfit!.id}/replace-item`)
          .set(as(laura))
          .send({ role: 'shoes', replacementItemId })
          .expect(400);
    });
  });

  describe('variants', () => {
    it('keeps the locked pieces and proposes a new look', async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura, {
        exclusions: { categories: ['DRESS'] },
      });
      const bottom = outfit!.pieces.find((p) => p.role === 'bottom')!.item;

      const res = await http()
        .post(`/outfits/${outfit!.id}/variant`)
        .set(as(laura))
        .send({ lockedItemIds: [bottom.id] })
        .expect(201);
      const variant = res.body as Outfit;

      expect(variant.id).not.toBe(outfit!.id);
      expect(variant.variantOf).toBe(outfit!.id);
      expect(itemIds(variant)).toContain(bottom.id);
      expect(itemIds(variant).sort()).not.toEqual(itemIds(outfit!).sort());
    });

    it("cannot vary someone else's look", async () => {
      await wardrobe(laura);
      const [outfit] = await generate(laura);

      await http()
        .post(`/outfits/${outfit!.id}/variant`)
        .set(as(other))
        .send({})
        .expect(404);
    });
  });
});
