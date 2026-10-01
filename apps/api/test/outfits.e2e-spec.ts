import type {
  ApiErrorBody,
  AuthSession,
  Outfit,
  OutfitAlternative,
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

  it('requires authentication', async () => {
    await http().post('/outfits/generate').send({}).expect(401);
    await http().get('/outfits').expect(401);
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

  describe('reading', () => {
    it('lists the latest looks and keeps them private', async () => {
      await wardrobe(laura);
      const outfits = await generate(laura);

      const recent = await http()
        .get('/outfits?limit=2')
        .set(as(laura))
        .expect(200);
      expect(recent.body).toHaveLength(2);
      expect((recent.body as Outfit[])[0]!.id).toBe(outfits[0]!.id);

      await http().get(`/outfits/${outfits[0]!.id}`).set(as(other)).expect(404);
      const theirs = await http().get('/outfits').set(as(other)).expect(200);
      expect(theirs.body).toEqual([]);
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
