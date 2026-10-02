import {
  listNotificationsQuerySchema,
  notificationSettingsSchema,
  type NotificationSettingsInput,
} from '@klotho/shared';

import { NotificationNotFoundError } from '../../domain/notifications/errors';
import type { WardrobeItem } from '../../domain/wardrobe/entities/wardrobe-item.entity';
import { DAY, MINUTE } from '../../testing/fakes';
import {
  InMemoryNotificationRepository,
  InMemoryNotificationSettingsRepository,
} from '../../testing/in-memory-notification.repositories';
import { InMemoryOutfitPlanRepository } from '../../testing/in-memory-planning.repositories';
import { outfitWorkshop } from '../../testing/outfit-workshop';
import { InMemoryFileStorage } from '../../testing/storage-fakes';
import {
  NotificationCenter,
  type NotificationFailureReporter,
} from './notification-center';
import {
  CountUnreadNotificationsUseCase,
  DeleteNotificationUseCase,
  GetNotificationSettingsUseCase,
  ListNotificationsUseCase,
  MarkAllNotificationsReadUseCase,
  MarkNotificationReadUseCase,
  SaveNotificationSettingsUseCase,
} from './notifications.use-cases';
import { TimelyNotifications } from './timely-notifications';

describe('Notifications', () => {
  let t: ReturnType<typeof outfitWorkshop>;
  let notifications: InMemoryNotificationRepository;
  let settings: InMemoryNotificationSettingsRepository;
  let plans: InMemoryOutfitPlanRepository;
  let failures: Parameters<NotificationFailureReporter>[0][];
  let center: NotificationCenter;
  let timely: TimelyNotifications;

  const setSettings = (input: NotificationSettingsInput) =>
    settings.save('laura', notificationSettingsSchema.parse(input));
  const kinds = (userId = 'laura') =>
    notifications.of(userId).map((n) => n.kind);
  const photo = (item: WardrobeItem, n: number) => {
    t.wardrobe.items
      .find((i) => i.id === item.id)!
      .photos.push({
        id: `photo-${item.id}-${n}`,
        itemId: item.id,
        storageKey: `users/laura/${item.id}-${n}.jpg`,
        width: 1200,
        height: 1600,
        position: n,
        isMain: n === 0,
        createdAt: t.clock.now(),
      });
  };

  beforeEach(() => {
    t = outfitWorkshop();
    notifications = new InMemoryNotificationRepository();
    settings = new InMemoryNotificationSettingsRepository();
    plans = new InMemoryOutfitPlanRepository(t.outfits);
    failures = [];
    const report: NotificationFailureReporter = (failure) =>
      failures.push(failure);
    center = new NotificationCenter(notifications, settings, t.clock, report);
    timely = new TimelyNotifications(
      notifications,
      settings,
      plans,
      t.outfits,
      t.wardrobe,
      t.clock,
      report,
    );
  });

  describe('NotificationCenter', () => {
    it('groups the generations of 10 minutes while unread', async () => {
      await center.outfitsGenerated('laura', { count: 5, outfitId: 'a' });
      t.clock.advance(6 * MINUTE);
      await center.outfitsGenerated('laura', { count: 5, outfitId: 'b' });
      t.clock.advance(10 * MINUTE);
      await center.outfitsGenerated('laura', { count: 3, outfitId: 'c' });

      expect(notifications.of('laura')).toEqual([
        expect.objectContaining({
          kind: 'outfitsGenerated',
          data: { count: 13, outfitId: 'c' },
          createdAt: t.clock.now(),
          readAt: null,
        }),
      ]);
    });

    it('starts a new one after 10 minutes, once read or after another one', async () => {
      await center.outfitsGenerated('laura', { count: 5, outfitId: 'a' });
      t.clock.advance(11 * MINUTE);
      await center.outfitsGenerated('laura', { count: 5, outfitId: 'b' });
      await notifications.markAllRead('laura', t.clock.now());
      t.clock.advance(MINUTE);
      await center.outfitsGenerated('laura', { count: 5, outfitId: 'c' });
      t.clock.advance(MINUTE);
      await center.weekPlanned('laura', { count: 7, outfitId: 'd' });
      t.clock.advance(MINUTE);
      await center.outfitsGenerated('laura', { count: 5, outfitId: 'e' });
      await center.outfitsGenerated('other', { count: 5, outfitId: 'f' });

      expect(notifications.of('laura').map((n) => n.data)).toEqual([
        { count: 5, outfitId: 'e' },
        { count: 7, outfitId: 'd' },
        { count: 5, outfitId: 'c' },
        { count: 5, outfitId: 'b' },
        { count: 5, outfitId: 'a' },
      ]);
      expect(kinds('other')).toEqual(['outfitsGenerated']);
    });

    it('respects the settings: reminders for looks, tips for pieces', async () => {
      await setSettings({ reminders: false });
      await center.outfitsGenerated('laura', { count: 5, outfitId: 'a' });
      await center.weekPlanned('laura', { count: 7, outfitId: 'a' });
      await center.pieceAvailable('laura', { itemId: 'i', itemName: null });
      expect(kinds()).toEqual(['pieceAvailable']);

      await setSettings({ tips: false });
      await center.pieceAvailable('laura', { itemId: 'i', itemName: null });
      t.clock.advance(MINUTE);
      await center.weekPlanned('laura', { count: 7, outfitId: 'a' });
      expect(kinds()).toEqual(['weekPlanned', 'pieceAvailable']);
    });

    it('never fails the action, and reports the failure', async () => {
      notifications.failing = true;

      await expect(
        center.outfitsGenerated('laura', { count: 5, outfitId: 'a' }),
      ).resolves.toBeUndefined();
      expect(failures).toEqual([
        { kind: 'outfitsGenerated', error: expect.any(Error) },
      ]);
    });
  });

  describe('TimelyNotifications', () => {
    describe('dailyOutfit', () => {
      it("is created once a day for the day's plan, even once deleted", async () => {
        const top = await t.add('laura', 'TOP');
        const look = await t.save('laura', [top]);
        await plans.save('laura', {
          day: '2026-10-01',
          outfitId: look.id,
          forecast: null,
        });

        await timely.ensure('laura');
        await timely.ensure('laura');
        const [daily] = notifications.of('laura');
        expect(notifications.of('laura')).toEqual([
          expect.objectContaining({
            kind: 'dailyOutfit',
            data: { outfitId: look.id },
          }),
        ]);

        await notifications.delete('laura', daily!.id);
        t.clock.advance(15 * 60 * MINUTE); // 23:00 UTC
        await timely.ensure('laura');
        expect(kinds()).toEqual([]);

        // The next day, without any look of that day: nothing.
        t.clock.advance(2 * 60 * MINUTE);
        await timely.ensure('laura');
        expect(kinds()).toEqual([]);
        await plans.save('laura', {
          day: '2026-10-02',
          outfitId: look.id,
          forecast: null,
        });
        await timely.ensure('laura');
        expect(kinds()).toEqual(['dailyOutfit']);
      });

      it('is created for a look generated today, not yesterday', async () => {
        const top = await t.add('laura', 'TOP');
        await t.save('laura', [top]);
        t.clock.advance(DAY);
        await timely.ensure('laura');
        expect(kinds()).toEqual([]);

        const today = await t.save('laura', [top]);
        await timely.ensure('laura');
        expect(notifications.of('laura')[0]?.data).toEqual({
          outfitId: today.id,
        });
      });

      it('needs the reminders', async () => {
        await setSettings({ reminders: false });
        const top = await t.add('laura', 'TOP');
        await t.save('laura', [top]);

        await timely.ensure('laura');

        expect(kinds()).toEqual([]);
      });

      it('is created once under concurrent requests', async () => {
        const top = await t.add('laura', 'TOP');
        await t.save('laura', [top]);

        await Promise.all([timely.ensure('laura'), timely.ensure('laura')]);

        expect(kinds()).toEqual(['dailyOutfit']);
      });
    });

    describe('forgottenPiece', () => {
      let blazer: WardrobeItem;
      let jean: WardrobeItem;

      beforeEach(async () => {
        await setSettings({ reminders: false });
        // 2026-09-01: 30 days before the clock.
        t.clock.advance(-30 * DAY);
        blazer = await t.add('laura', 'LAYER', { name: 'Blazer beige' });
        jean = await t.add('laura', 'BOTTOM');
        await t.add('laura', 'TOP', { status: 'WASHING' });
        t.clock.advance(30 * DAY);
        await t.add('laura', 'SHOES');
      });

      const worn = (item: WardrobeItem, daysAgo: number) =>
        t.wardrobe.updateUsage(item.id, (i) => ({
          wearCount: i.wearCount + 1,
          lastWornAt: new Date(t.clock.now().getTime() - daysAgo * DAY),
        }));

      it('is the available piece least recently worn for 3 weeks', async () => {
        worn(blazer, 25);
        worn(jean, 22);

        await timely.ensure('laura');

        expect(notifications.of('laura')).toEqual([
          expect.objectContaining({
            kind: 'forgottenPiece',
            data: { itemId: blazer.id, itemName: 'Blazer beige', weeks: 3 },
          }),
        ]);
      });

      it('counts a piece never worn from its addition, first', async () => {
        worn(blazer, 25);

        await timely.ensure('laura');

        expect(notifications.of('laura')[0]?.data).toEqual({
          itemId: jean.id,
          itemName: null,
          weeks: 4,
        });
      });

      it('comes once a week at most, never the same piece twice in a row', async () => {
        await timely.ensure('laura');
        const [first] = notifications.of('laura');
        await notifications.delete('laura', first!.id);
        t.clock.advance(6 * DAY);
        await timely.ensure('laura');
        expect(kinds()).toEqual([]);

        t.clock.advance(DAY + MINUTE);
        await timely.ensure('laura');
        t.clock.advance(7 * DAY + MINUTE);
        await timely.ensure('laura');

        expect(notifications.of('laura').map((n) => n.data.itemId)).toEqual([
          blazer.id,
          jean.id,
        ]);
      });

      it('needs the tips and a piece forgotten for 3 weeks', async () => {
        worn(blazer, 20);
        worn(jean, 1);
        await timely.ensure('laura');
        expect(kinds()).toEqual([]);

        worn(blazer, 30);
        await setSettings({ reminders: false, tips: false });
        await timely.ensure('laura');
        expect(kinds()).toEqual([]);
      });
    });

    it('never fails the reading, and reports the failure', async () => {
      notifications.failing = true;

      await expect(timely.ensure('laura')).resolves.toBeUndefined();
      expect(failures).toEqual([{ kind: 'timely', error: expect.any(Error) }]);
    });
  });

  describe('use cases', () => {
    const list = (input: object = {}) =>
      new ListNotificationsUseCase(
        notifications,
        timely,
        t.wardrobe,
        t.outfits,
        new InMemoryFileStorage(),
      ).execute('laura', listNotificationsQuerySchema.parse(input));

    it('lists newest first, by category, with signed photos read now', async () => {
      const blazer = await t.add('laura', 'LAYER', { name: 'Blazer' });
      const top = await t.add('laura', 'TOP');
      const shoes = await t.add('laura', 'SHOES');
      photo(blazer, 0);
      photo(shoes, 0);
      const look = await t.save('laura', [top, shoes]);
      t.clock.advance(MINUTE);
      const bare = await t.save('laura', [top]);
      await setSettings({ reminders: false });

      await center.pieceAvailable('laura', {
        itemId: blazer.id,
        itemName: 'Blazer',
      });
      t.clock.advance(MINUTE);
      await setSettings({});
      await center.weekPlanned('laura', { count: 7, outfitId: look.id });
      t.clock.advance(MINUTE);
      await center.outfitsGenerated('laura', { count: 5, outfitId: bare.id });
      await center.pieceAvailable('other', { itemId: 'x', itemName: null });

      const page = await list();

      expect(page).toMatchObject({
        total: 4,
        page: 1,
        pageSize: 20,
        hasMore: false,
      });
      expect(page.items.map((n) => [n.kind, n.category, n.data])).toEqual([
        // The look of today made a dailyOutfit when read.
        ['dailyOutfit', 'outfits', { outfitId: bare.id, imageUrl: null }],
        [
          'outfitsGenerated',
          'outfits',
          { count: 5, outfitId: bare.id, imageUrl: null },
        ],
        [
          'weekPlanned',
          'outfits',
          {
            count: 7,
            outfitId: look.id,
            imageUrl: `https://storage.test/users/laura/${shoes.id}-0.jpg?signature=fake`,
          },
        ],
        [
          'pieceAvailable',
          'dressing',
          {
            itemId: blazer.id,
            itemName: 'Blazer',
            imageUrl: `https://storage.test/users/laura/${blazer.id}-0.jpg?signature=fake`,
          },
        ],
      ]);
      expect(page.items[0]).toMatchObject({
        read: false,
        createdAt: t.clock.now().toISOString(),
      });
      // Never stored.
      expect(notifications.of('laura')[3]?.data).not.toHaveProperty('imageUrl');

      const dressing = await list({ category: 'dressing' });
      expect(dressing.items.map((n) => n.kind)).toEqual(['pieceAvailable']);
      const second = await list({ page: 2, pageSize: 3 });
      expect(second).toMatchObject({ total: 4, hasMore: false });
      expect(second.items.map((n) => n.kind)).toEqual(['pieceAvailable']);
    });

    it('counts, reads and deletes only my notifications', async () => {
      await center.weekPlanned('laura', { count: 7, outfitId: 'a' });
      t.clock.advance(MINUTE);
      await center.weekPlanned('laura', { count: 2, outfitId: 'b' });
      await center.weekPlanned('other', { count: 2, outfitId: 'c' });
      const [newest, oldest] = notifications.of('laura');
      const [others] = notifications.of('other');
      const count = new CountUnreadNotificationsUseCase(notifications, timely);
      const read = new MarkNotificationReadUseCase(notifications, t.clock);
      const remove = new DeleteNotificationUseCase(notifications);

      await expect(count.execute('laura')).resolves.toEqual({ count: 2 });
      await read.execute('laura', newest!.id);
      const readAt = notifications.of('laura')[0]!.readAt;
      t.clock.advance(MINUTE);
      await read.execute('laura', newest!.id);
      expect(notifications.of('laura')[0]!.readAt).toEqual(readAt);
      await expect(count.execute('laura')).resolves.toEqual({ count: 1 });

      for (const act of [
        () => read.execute('laura', others!.id),
        () => remove.execute('laura', others!.id),
        () => remove.execute('laura', 'missing'),
      ])
        await expect(act()).rejects.toBeInstanceOf(NotificationNotFoundError);

      await new MarkAllNotificationsReadUseCase(notifications, t.clock).execute(
        'laura',
      );
      await expect(count.execute('laura')).resolves.toEqual({ count: 0 });
      await expect(count.execute('other')).resolves.toEqual({ count: 1 });
      await remove.execute('laura', oldest!.id);
      expect(notifications.of('laura').map((n) => n.id)).toEqual([newest!.id]);
    });

    it('gives the default settings, then the saved ones', async () => {
      const get = new GetNotificationSettingsUseCase(settings);
      await expect(get.execute('laura')).resolves.toEqual({
        tips: true,
        reminders: true,
        news: false,
        reminderTime: '08:00',
      });

      const saved = notificationSettingsSchema.parse({
        tips: false,
        news: true,
        reminderTime: '07:30',
      });
      await expect(
        new SaveNotificationSettingsUseCase(settings).execute('laura', saved),
      ).resolves.toEqual(saved);
      await expect(get.execute('laura')).resolves.toEqual(saved);
    });
  });
});
