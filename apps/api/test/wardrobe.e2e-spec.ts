import type { AuthSession, Page, WardrobeItem } from '@klotho/shared';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

describe('Wardrobe (e2e)', () => {
  let t: TestApp;
  let laura: string;
  let other: string;
  const http = () => request(t.app.getHttpServer());

  async function tokenFor(email: string): Promise<string> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: 'Dressing2026!', firstName: 'Test' })
      .expect(201);
    return (res.body as AuthSession).tokens.accessToken;
  }

  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function add(token: string, body: object): Promise<WardrobeItem> {
    const res = await http()
      .post('/wardrobe')
      .set(as(token))
      .send(body)
      .expect(201);
    return res.body as WardrobeItem;
  }

  async function list(token: string, query = ''): Promise<Page<WardrobeItem>> {
    const res = await http()
      .get(`/wardrobe${query}`)
      .set(as(token))
      .expect(200);
    return res.body as Page<WardrobeItem>;
  }

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
    ['GET', '/wardrobe'],
    ['POST', '/wardrobe'],
    ['GET', '/wardrobe/x'],
    ['PATCH', '/wardrobe/x'],
    ['DELETE', '/wardrobe/x'],
  ])('%s %s requires authentication', async (method, path) => {
    await http()[method.toLowerCase() as 'get'](path).expect(401);
  });

  describe('POST /wardrobe', () => {
    it('creates an available item for the authenticated user', async () => {
      const item = await add(laura, {
        name: 'Blouse',
        category: 'TOP',
        primaryColor: 'powderPink',
        styles: ['romantic'],
      });

      expect(item).toMatchObject({
        name: 'Blouse',
        status: 'AVAILABLE',
        wearCount: 0,
        styles: ['romantic'],
      });
      expect(item).not.toHaveProperty('userId');
    });

    it('ignores an owner sent in the body', async () => {
      const { user } = (
        await http()
          .post('/auth/login')
          .send({ email: 'other@example.com', password: 'Dressing2026!' })
      ).body as AuthSession;

      const item = await add(laura, {
        category: 'TOP',
        primaryColor: 'ecru',
        userId: user.id,
      });

      await http().get(`/wardrobe/${item.id}`).set(as(other)).expect(404);
      await http().get(`/wardrobe/${item.id}`).set(as(laura)).expect(200);
    });

    it('400 with i18n keys for missing or invalid values', async () => {
      const res = await http()
        .post('/wardrobe')
        .set(as(laura))
        .send({ category: 'HAT', styles: ['gothic'] })
        .expect(400);

      expect(res.body.issues).toEqual(
        expect.arrayContaining([
          { path: 'category', message: 'errors.wardrobe.category' },
          { path: 'primaryColor', message: 'errors.wardrobe.color' },
          { path: 'styles.0', message: 'errors.wardrobe.style' },
        ]),
      );
    });
  });

  describe('GET /wardrobe', () => {
    beforeEach(async () => {
      await add(laura, {
        name: 'Blouse fleurie',
        category: 'TOP',
        primaryColor: 'powderPink',
        seasons: ['spring', 'summer'],
        styles: ['romantic'],
        minTemperature: 15,
        maxTemperature: 30,
      });
      await add(laura, {
        name: 'Jean droit',
        category: 'BOTTOM',
        primaryColor: 'denim',
        brand: 'Levis',
        styles: ['casual'],
        status: 'WASHING',
      });
      await add(laura, {
        name: 'Ceinture',
        category: 'ACCESSORY',
        primaryColor: 'chocolate',
        secondaryColors: ['gold'],
      });
      await add(other, {
        name: 'Pas à moi',
        category: 'TOP',
        primaryColor: 'black',
      });
    });

    it('lists only my items, most recent first', async () => {
      const page = await list(laura);

      expect(page).toMatchObject({
        total: 3,
        page: 1,
        pageSize: 24,
        hasMore: false,
      });
      expect(page.items.map((i) => i.name)).toEqual([
        'Ceinture',
        'Jean droit',
        'Blouse fleurie',
      ]);
    });

    it('paginates', async () => {
      const first = await list(laura, '?pageSize=2');
      const second = await list(laura, '?pageSize=2&page=2');

      expect(first).toMatchObject({ total: 3, hasMore: true });
      expect([...first.items, ...second.items].map((i) => i.name)).toHaveLength(
        3,
      );
      expect(second.hasMore).toBe(false);
    });

    it.each([
      ['?category=TOP,BOTTOM', ['Jean droit', 'Blouse fleurie']],
      ['?status=WASHING', ['Jean droit']],
      ['?season=summer', ['Blouse fleurie']],
      ['?style=casual', ['Jean droit']],
      ['?color=gold', ['Ceinture']],
      ['?q=LEVIS', ['Jean droit']],
      ['?temperature=5', ['Ceinture', 'Jean droit']],
      ['?sort=alphabetical', ['Blouse fleurie', 'Ceinture', 'Jean droit']],
    ])('supports %s', async (query, expected) => {
      const page = await list(laura, query);

      expect(page.items.map((i) => i.name)).toEqual(expected);
    });

    it('400 for an unknown filter value', async () => {
      await http().get('/wardrobe?category=HAT').set(as(laura)).expect(400);
    });
  });

  describe('GET / PATCH / DELETE /wardrobe/:id', () => {
    let item: WardrobeItem;

    beforeEach(async () => {
      item = await add(laura, {
        category: 'LAYER',
        primaryColor: 'sand',
        minTemperature: 5,
        maxTemperature: 15,
      });
    });

    it('PATCH changes only the given fields', async () => {
      const res = await http()
        .patch(`/wardrobe/${item.id}`)
        .set(as(laura))
        .send({ status: 'WASHING' })
        .expect(200);

      expect(res.body).toMatchObject({
        status: 'WASHING',
        category: 'LAYER',
        primaryColor: 'sand',
      });
    });

    it('PATCH refuses to invert the stored temperature range', async () => {
      const res = await http()
        .patch(`/wardrobe/${item.id}`)
        .set(as(laura))
        .send({ minTemperature: 20 })
        .expect(400);

      expect(res.body.code).toBe('wardrobe.invalidTemperatureRange');
    });

    it.each([
      ['get', undefined],
      ['patch', { status: 'SOLD' }],
      ['delete', undefined],
    ] as const)(
      "%s on another user's item answers the same 404 as a missing item",
      async (method, body) => {
        const foreign = await http()
          [method](`/wardrobe/${item.id}`)
          .set(as(other))
          .send(body);
        const missing = await http()
          [method]('/wardrobe/does-not-exist')
          .set(as(other))
          .send(body);

        expect(foreign.status).toBe(404);
        expect(foreign.body).toEqual({
          statusCode: 404,
          code: 'wardrobe.notFound',
        });
        expect(missing.body).toEqual(foreign.body);
      },
    );

    it("never modifies another user's item", async () => {
      await http()
        .patch(`/wardrobe/${item.id}`)
        .set(as(other))
        .send({ status: 'SOLD' });
      await http().delete(`/wardrobe/${item.id}`).set(as(other));

      const res = await http()
        .get(`/wardrobe/${item.id}`)
        .set(as(laura))
        .expect(200);
      expect((res.body as WardrobeItem).status).toBe('AVAILABLE');
    });

    it('DELETE removes my item', async () => {
      await http().delete(`/wardrobe/${item.id}`).set(as(laura)).expect(204);
      await http().get(`/wardrobe/${item.id}`).set(as(laura)).expect(404);
    });
  });

  describe('favourite pieces', () => {
    it('PUT / DELETE /wardrobe/:id/favorite, idempotent, and ?favorite=true', async () => {
      const blouse = await add(laura, {
        category: 'TOP',
        primaryColor: 'ecru',
      });
      const jeans = await add(laura, {
        category: 'BOTTOM',
        primaryColor: 'denim',
      });
      expect(blouse.isFavorite).toBe(false);

      for (let i = 0; i < 2; i += 1) {
        const res = await http()
          .put(`/wardrobe/${blouse.id}/favorite`)
          .set(as(laura))
          .expect(200);
        expect((res.body as WardrobeItem).isFavorite).toBe(true);
      }
      const favorites = await list(laura, '?favorite=true');
      expect(favorites.items.map((i) => i.id)).toEqual([blouse.id]);
      expect(
        (await list(laura, '?favorite=false')).items.map((i) => i.id),
      ).toEqual([jeans.id]);

      for (let i = 0; i < 2; i += 1) {
        const res = await http()
          .delete(`/wardrobe/${blouse.id}/favorite`)
          .set(as(laura))
          .expect(200);
        expect((res.body as WardrobeItem).isFavorite).toBe(false);
      }
      expect((await list(laura, '?favorite=true')).total).toBe(0);
    });

    it("404 for an unknown item or another user's", async () => {
      const item = await add(laura, { category: 'TOP', primaryColor: 'ecru' });

      await http()
        .put(`/wardrobe/${item.id}/favorite`)
        .set(as(other))
        .expect(404);
      await http()
        .delete(`/wardrobe/${item.id}/favorite`)
        .set(as(other))
        .expect(404);
      await http().put('/wardrobe/unknown/favorite').set(as(laura)).expect(404);
      await http().put(`/wardrobe/${item.id}/favorite`).expect(401);
      expect((await list(laura, '?favorite=true')).total).toBe(0);
    });

    it('400 for an invalid favourite filter', async () => {
      await http().get('/wardrobe?favorite=maybe').set(as(laura)).expect(400);
    });
  });

  it('deleting the account deletes its items (cascade)', async () => {
    await add(laura, { category: 'TOP', primaryColor: 'ecru' });

    await t.prisma.user.delete({ where: { email: 'laura@example.com' } });

    expect(await t.prisma.wardrobeItem.count()).toBe(0);
  });
});
