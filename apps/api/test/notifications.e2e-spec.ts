import type {
  AppNotification,
  AuthSession,
  NotificationKind,
  Outfit,
  OutfitPlan,
  Page,
  WardrobeItem,
} from '@klotho/shared';
import request from 'supertest';

import { createTestApp, type TestApp } from './utils/test-app';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const PASSWORD = 'Dressing2026!';

describe('Notifications (e2e)', () => {
  let t: TestApp;
  let laura: string;
  let other: string;
  const http = () => request(t.app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });
  const today = () => t.clock.now().toISOString().slice(0, 10);

  async function tokenFor(email: string): Promise<string> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: PASSWORD, firstName: 'Test' })
      .expect(201);
    return (res.body as AuthSession).tokens.accessToken;
  }

  async function addPiece(category: string, name: string) {
    const res = await http()
      .post('/wardrobe')
      .set(as(laura))
      .send({ category, name, primaryColor: 'ecru' })
      .expect(201);
    return res.body as WardrobeItem;
  }

  /** 2 tops, 2 bottoms, 2 shoes; the first top has a photo. */
  async function wardrobe() {
    const pieces: WardrobeItem[] = [];
    for (const [category, name] of [
      ['TOP', 'Blouse'],
      ['TOP', 'Chemise'],
      ['BOTTOM', 'Jean'],
      ['BOTTOM', 'Jupe'],
      ['SHOES', 'Baskets'],
      ['SHOES', 'Mocassins'],
    ])
      pieces.push(await addPiece(category!, name!));
    await t.prisma.wardrobeItemPhoto.create({
      data: {
        itemId: pieces[0]!.id,
        storageKey: 'users/laura/blouse.jpg',
        width: 1200,
        height: 1600,
        isMain: true,
      },
    });
    return pieces;
  }

  async function generate(): Promise<Outfit[]> {
    const res = await http()
      .post('/outfits/generate')
      .set(as(laura))
      .send({ temperature: 18 })
      .expect(201);
    return res.body as Outfit[];
  }

  async function list(query = '', token = laura) {
    const res = await http()
      .get(`/notifications${query}`)
      .set(as(token))
      .expect(200);
    return res.body as Page<AppNotification>;
  }

  const ofKind = async (kind: NotificationKind, token = laura) =>
    (await list('?pageSize=50', token)).items.filter((n) => n.kind === kind);

  const unread = async (token = laura) =>
    (
      (
        await http()
          .get('/notifications/unread-count')
          .set(as(token))
          .expect(200)
      ).body as { count: number }
    ).count;

  const saveSettings = (body: object, token = laura) =>
    http().put('/notifications/settings').set(as(token)).send(body);

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

  describe('settings', () => {
    it('gives the defaults, then replaces them', async () => {
      const defaults = await http()
        .get('/notifications/settings')
        .set(as(laura))
        .expect(200);
      expect(defaults.body).toEqual({
        tips: true,
        reminders: true,
        news: false,
        reminderTime: '08:00',
      });

      const saved = await saveSettings({
        tips: false,
        reminders: true,
        news: true,
        reminderTime: '07:30',
      }).expect(200);
      expect(saved.body).toEqual({
        tips: false,
        reminders: true,
        news: true,
        reminderTime: '07:30',
      });
      await saveSettings({ reminders: false }).expect(200);

      const res = await http()
        .get('/notifications/settings')
        .set(as(laura))
        .expect(200);
      expect(res.body).toEqual({
        tips: true,
        reminders: false,
        news: false,
        reminderTime: '08:00',
      });
      await http()
        .get('/notifications/settings')
        .set(as(other))
        .expect(200)
        .expect((r) => expect(r.body).toEqual(defaults.body));
    });

    it('validates them', async () => {
      const res = await saveSettings({ reminderTime: '25:00' }).expect(400);
      expect(res.body).toMatchObject({ code: 'validation.failed' });
      await saveSettings({ tips: 'yes' }).expect(400);
    });
  });

  describe('outfitsGenerated', () => {
    it('groups the generations of 10 minutes, with the best look and its photo', async () => {
      const [blouse] = await wardrobe();
      await generate();
      const second = await generate();

      const [grouped, ...rest] = await ofKind('outfitsGenerated');
      expect(rest).toEqual([]);
      expect(grouped).toEqual({
        id: expect.any(String),
        kind: 'outfitsGenerated',
        category: 'outfits',
        data: {
          count: 10,
          outfitId: second[0]!.id,
          imageUrl: second[0]!.pieces.some((p) => p.item.id === blouse!.id)
            ? 'https://storage.test/users/laura/blouse.jpg?signature=fake'
            : null,
        },
        read: false,
        createdAt: expect.any(String),
      });

      t.clock.advance(11 * MINUTE);
      const third = await generate();
      const generated = await ofKind('outfitsGenerated');
      expect(generated.map((n) => n.data)).toEqual([
        expect.objectContaining({ count: 5, outfitId: third[0]!.id }),
        expect.objectContaining({ count: 10 }),
      ]);
      expect(await ofKind('outfitsGenerated', other)).toEqual([]);
    });

    it('starts a new one once read', async () => {
      await wardrobe();
      await generate();
      await http().post('/notifications/read-all').set(as(laura)).expect(204);
      await generate();

      expect(
        (await ofKind('outfitsGenerated')).map((n) => [n.data.count, n.read]),
      ).toEqual([
        [5, false],
        [5, true],
      ]);
    });
  });

  describe('weekPlanned and pieceAvailable', () => {
    it('notifies a planned week with its first look', async () => {
      const [blouse] = await wardrobe();
      const res = await http()
        .post('/plans/week')
        .set(as(laura))
        .send({ from: today() })
        .expect(200);
      const plans = res.body as OutfitPlan[];

      expect((await ofKind('weekPlanned')).map((n) => n.data)).toEqual([
        {
          count: plans.length,
          outfitId: plans[0]!.outfit.id,
          imageUrl: plans[0]!.outfit.pieces.some(
            (p) => p.item.id === blouse!.id,
          )
            ? 'https://storage.test/users/laura/blouse.jpg?signature=fake'
            : null,
        },
      ]);
    });

    it('notifies a favourite piece available again', async () => {
      const [blouse, chemise] = await wardrobe();
      const patch = (id: string, status: string) =>
        http()
          .patch(`/wardrobe/${id}`)
          .set(as(laura))
          .send({ status })
          .expect(200);
      for (const piece of [blouse!, chemise!]) {
        await patch(piece.id, 'WASHING');
        await patch(piece.id, 'AVAILABLE');
      }
      expect(await ofKind('pieceAvailable')).toEqual([]);

      await http()
        .put(`/wardrobe/${blouse!.id}/favorite`)
        .set(as(laura))
        .expect(200);
      await patch(blouse!.id, 'LENT');
      await patch(blouse!.id, 'AVAILABLE');

      const dressing = await list('?category=dressing');
      expect(dressing.items).toEqual([
        expect.objectContaining({
          kind: 'pieceAvailable',
          category: 'dressing',
          data: {
            itemId: blouse!.id,
            itemName: 'Blouse',
            imageUrl:
              'https://storage.test/users/laura/blouse.jpg?signature=fake',
          },
        }),
      ]);
    });

    it('respects the settings', async () => {
      const [blouse] = await wardrobe();
      await saveSettings({ reminders: false, tips: false }).expect(200);
      await generate();
      await http()
        .post('/plans/week')
        .set(as(laura))
        .send({ from: today() })
        .expect(200);
      await http()
        .put(`/wardrobe/${blouse!.id}/favorite`)
        .set(as(laura))
        .expect(200);
      await http()
        .patch(`/wardrobe/${blouse!.id}`)
        .set(as(laura))
        .send({ status: 'WASHING' })
        .expect(200);
      await http()
        .patch(`/wardrobe/${blouse!.id}`)
        .set(as(laura))
        .send({ status: 'AVAILABLE' })
        .expect(200);
      t.clock.advance(30 * DAY);

      expect(await list()).toMatchObject({ items: [], total: 0 });
      expect(await unread()).toBe(0);

      // News gates nothing yet; tips alone bring the pieces back.
      await saveSettings({ reminders: false, tips: true }).expect(200);
      expect((await list()).items.map((n) => n.kind)).toEqual([
        'forgottenPiece',
      ]);
    });
  });

  describe('time-based notifications', () => {
    it("creates the dailyOutfit once a day for the day's plan, even once deleted", async () => {
      await wardrobe();
      const [look] = await generate();
      await saveSettings({ tips: false }).expect(200);
      // Tomorrow: the looks were generated yesterday.
      t.clock.advance(DAY);
      expect(await ofKind('dailyOutfit')).toEqual([]);

      await http()
        .put(`/plans/${today()}`)
        .set(as(laura))
        .send({ outfitId: look!.id })
        .expect(200);
      expect(await unread()).toBe(2);
      expect(await unread()).toBe(2);
      const [daily] = await ofKind('dailyOutfit');
      expect(daily).toMatchObject({
        category: 'outfits',
        data: { outfitId: look!.id },
        read: false,
      });

      await http()
        .delete(`/notifications/${daily!.id}`)
        .set(as(laura))
        .expect(204);
      expect(await ofKind('dailyOutfit')).toEqual([]);

      t.clock.advance(DAY);
      await http()
        .put(`/plans/${today()}`)
        .set(as(laura))
        .send({ outfitId: look!.id })
        .expect(200);
      expect(await ofKind('dailyOutfit')).toHaveLength(1);
    });

    it('creates the dailyOutfit for a look generated today, once under concurrent reads', async () => {
      await wardrobe();
      const [best] = await generate();

      await Promise.all([unread(), unread(), list()]);

      expect((await ofKind('dailyOutfit')).map((n) => n.data.outfitId)).toEqual(
        [best!.id],
      );
    });

    it('creates a forgottenPiece once a week, never the same twice in a row', async () => {
      const blazer = await addPiece('LAYER', 'Blazer beige');
      const jean = await addPiece('BOTTOM', 'Jean');
      await http()
        .patch(`/wardrobe/${jean.id}`)
        .set(as(laura))
        .send({ status: 'WASHING' })
        .expect(200);
      expect(await ofKind('forgottenPiece')).toEqual([]);

      t.clock.advance(22 * DAY);
      const [first] = (await list('?category=dressing')).items;
      expect(first).toMatchObject({
        kind: 'forgottenPiece',
        category: 'dressing',
        data: {
          itemId: blazer.id,
          itemName: 'Blazer beige',
          weeks: 3,
          imageUrl: null,
        },
      });
      await http()
        .patch(`/wardrobe/${jean.id}`)
        .set(as(laura))
        .send({ status: 'AVAILABLE' })
        .expect(200);
      t.clock.advance(6 * DAY);
      expect(await ofKind('forgottenPiece')).toHaveLength(1);

      t.clock.advance(DAY + MINUTE);
      expect(
        (await ofKind('forgottenPiece')).map((n) => n.data.itemId),
      ).toEqual([jean.id, blazer.id]);
    });
  });

  describe('reading', () => {
    async function twoNotifications() {
      await saveSettings({ tips: false }).expect(200);
      await wardrobe();
      await generate();
      await http()
        .post('/plans/week')
        .set(as(laura))
        .send({ from: today() })
        .expect(200);
      // outfitsGenerated, weekPlanned and today's dailyOutfit.
      return (await list()).items;
    }

    it('pages newest first and filters by category', async () => {
      const items = await twoNotifications();
      expect(items.map((n) => n.kind)).toEqual([
        'dailyOutfit',
        'weekPlanned',
        'outfitsGenerated',
      ]);

      const page = await list('?page=2&pageSize=2');
      expect(page).toMatchObject({
        total: 3,
        page: 2,
        pageSize: 2,
        hasMore: false,
      });
      expect(page.items.map((n) => n.id)).toEqual([items[2]!.id]);
      expect(await list('?category=dressing')).toMatchObject({ total: 0 });
      expect((await list('?category=outfits')).total).toBe(3);
      await http()
        .get('/notifications?category=news')
        .set(as(laura))
        .expect(400);
      await http().get('/notifications?pageSize=51').set(as(laura)).expect(400);
    });

    it('marks as read (idempotent), all at once, and deletes', async () => {
      const [first, second] = await twoNotifications();
      expect(await unread()).toBe(3);

      await http()
        .post(`/notifications/${first!.id}/read`)
        .set(as(laura))
        .expect(204);
      await http()
        .post(`/notifications/${first!.id}/read`)
        .set(as(laura))
        .expect(204);
      expect(await unread()).toBe(2);
      expect((await list()).items[0]).toMatchObject({
        id: first!.id,
        read: true,
      });

      await http()
        .delete(`/notifications/${second!.id}`)
        .set(as(laura))
        .expect(204);
      await http().post('/notifications/read-all').set(as(laura)).expect(204);
      expect(await unread()).toBe(0);
      expect((await list()).items.map((n) => [n.id, n.read])).toEqual([
        [first!.id, true],
        [expect.any(String), true],
      ]);
    });

    it("answers 404 for a missing notification or another user's", async () => {
      const [first] = await twoNotifications();
      const notFound = { statusCode: 404, code: 'notifications.notFound' };

      for (const send of [
        () => http().post(`/notifications/${first!.id}/read`).set(as(other)),
        () => http().delete(`/notifications/${first!.id}`).set(as(other)),
        () => http().post('/notifications/missing/read').set(as(laura)),
        () => http().delete('/notifications/missing').set(as(laura)),
      ]) {
        const res = await send().expect(404);
        expect(res.body).toEqual(notFound);
      }
      await http().post('/notifications/read-all').set(as(other)).expect(204);
      expect(await unread()).toBe(3);
      expect(await list('', other)).toMatchObject({ items: [], total: 0 });
    });

    it('goes with the account', async () => {
      await twoNotifications();
      await saveSettings({ news: true }).expect(200);

      await http()
        .delete('/users/me')
        .set(as(laura))
        .send({ password: PASSWORD })
        .expect(204);

      expect(await t.prisma.notification.count()).toBe(0);
      expect(await t.prisma.notificationSettings.count()).toBe(0);
      expect(await t.prisma.notificationMarker.count()).toBe(0);
    });
  });
});
