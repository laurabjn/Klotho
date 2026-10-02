import type { AppNotification } from '@klotho/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

import i18n from '@/i18n';
import { renderWithProviders } from '@/testing/render';

import { notificationsApi } from './api/notifications.api';
import { NotificationBanner } from './components/NotificationBanner';
import { NotificationBell } from './components/NotificationBell';
import { describeNotification, timeAgo } from './lib/notification-text';
import { syncReminders } from './lib/reminders';
import { NotificationsScreen } from './screens/NotificationsScreen';

jest.mock('./api/notifications.api');
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
const api = jest.mocked(notificationsApi);

const notification = (
  overrides: Partial<AppNotification> = {},
): AppNotification => ({
  id: 'n1',
  kind: 'outfitsGenerated',
  category: 'outfits',
  data: { count: 5, outfitId: 'o1', imageUrl: null },
  read: false,
  createdAt: new Date(Date.now() - 10 * 60_000).toISOString(),
  ...overrides,
});

const page = (items: AppNotification[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 20,
  hasMore: false,
});

beforeEach(() => {
  jest.clearAllMocks();
  api.unreadCount.mockResolvedValue({ count: 1 });
  api.read.mockResolvedValue(undefined);
  api.readAll.mockResolvedValue(undefined);
});

describe('notification texts', () => {
  const t = i18n.getFixedT('fr');

  it('writes each kind in the app language', () => {
    expect(describeNotification(t, notification()).title).toBe(
      '5 nouvelles tenues générées',
    );
    expect(
      describeNotification(
        t,
        notification({
          kind: 'forgottenPiece',
          category: 'dressing',
          data: { itemId: 'i1', itemName: 'Blazer beige', weeks: 3 },
        }),
      ),
    ).toMatchObject({
      title: '« Blazer beige » n’a pas été portée depuis 3 semaines',
      route: '/piece/i1',
    });
  });

  it('says how long ago', () => {
    const now = Date.parse('2026-10-02T12:00:00Z');
    expect(timeAgo(t, '2026-10-02T11:50:00Z', now)).toBe('Il y a 10 min');
    expect(timeAgo(t, '2026-10-02T10:00:00Z', now)).toBe('Il y a 2 h');
    expect(timeAgo(t, '2026-10-01T12:00:00Z', now)).toBe('Il y a 1 jour');
  });
});

describe('NotificationsScreen', () => {
  it('lists the notifications by tab and opens one', async () => {
    api.list.mockImplementation(({ category }) =>
      Promise.resolve(
        page(
          category === 'dressing'
            ? [
                notification({
                  id: 'n2',
                  kind: 'pieceAvailable',
                  category: 'dressing',
                  data: { itemId: 'i1', itemName: 'Sac taupe' },
                }),
              ]
            : [notification()],
        ),
      ),
    );
    await renderWithProviders(<NotificationsScreen />);

    await fireEvent.press(
      await screen.findByRole('button', {
        name: '5 nouvelles tenues générées, Non lue',
      }),
    );
    expect(api.read).toHaveBeenCalledWith('n1');
    expect(router.push).toHaveBeenCalledWith('/outfits/o1');

    await fireEvent.press(screen.getByRole('radio', { name: 'Dressing' }));
    expect(
      await screen.findByText('Ta pièce préférée est de nouveau disponible'),
    ).toBeOnTheScreen();
  });

  it('marks everything as read', async () => {
    api.list.mockResolvedValue(page([notification()]));
    await renderWithProviders(<NotificationsScreen />);

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Tout marquer comme lu' }),
    );

    await waitFor(() => expect(api.readAll).toHaveBeenCalled());
  });
});

describe('NotificationBell and NotificationBanner', () => {
  it('shows the unread dot and opens the notifications', async () => {
    await renderWithProviders(<NotificationBell />);

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Notifications, 1 non lue' }),
    );

    expect(router.push).toHaveBeenCalledWith('/notifications');
  });

  it('shows the newest unread notification on Home, until closed', async () => {
    api.list.mockResolvedValue(page([notification()]));
    await renderWithProviders(<NotificationBanner />);

    expect(
      await screen.findByText('5 nouvelles tenues générées'),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Fermer' }));

    await waitFor(() => expect(api.read).toHaveBeenCalledWith('n1'));
  });
});

describe('syncReminders', () => {
  it('schedules the morning and Sunday reminders once allowed', async () => {
    await expect(
      syncReminders({ reminders: true, reminderTime: '07:30' }),
    ).resolves.toBe('scheduled');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        identifier: 'klotho.daily-outfit',
        trigger: expect.objectContaining({ hour: 7, minute: 30 }),
      }),
    );
  });

  it('only cancels them when the reminders are off', async () => {
    await expect(
      syncReminders({ reminders: false, reminderTime: '08:00' }),
    ).resolves.toBe('off');

    expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
