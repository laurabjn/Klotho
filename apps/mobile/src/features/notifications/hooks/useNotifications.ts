import type {
  AppNotification,
  NotificationCategory,
  NotificationSettingsInput,
} from '@klotho/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { notificationsApi } from '../api/notifications.api';
import { syncReminders } from '../lib/reminders';

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (category: NotificationCategory) =>
    ['notifications', 'list', category] as const,
  unread: ['notifications', 'unread'] as const,
  settings: ['notifications', 'settings'] as const,
};

/** New notifications appear without reopening the app (once a minute). */
const POLL_MS = 60_000;

export function useNotificationPages(category: NotificationCategory) {
  return useInfiniteQuery({
    queryKey: notificationKeys.list(category),
    queryFn: ({ pageParam }) =>
      notificationsApi.list({ category, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

/** The red dot of the bell. */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unread,
    queryFn: async () => (await notificationsApi.unreadCount()).count,
    refetchInterval: POLL_MS,
  });
}

/** The newest unread notification, for the home banner. */
export function useLatestUnread(): AppNotification | undefined {
  const latest = useQuery({
    queryKey: [...notificationKeys.all, 'latest'],
    queryFn: async () =>
      (await notificationsApi.list({ category: 'all', pageSize: 1 })).items[0],
    refetchInterval: POLL_MS,
  });
  return latest.data && !latest.data.read ? latest.data : undefined;
}

function useRefresh() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: notificationKeys.all });
}

export function useMarkRead() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.read(id),
    onSuccess: refresh,
  });
}

export function useMarkAllRead() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: () => notificationsApi.readAll(),
    onSuccess: refresh,
  });
}

export function useDeleteNotification() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: refresh,
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: notificationKeys.settings,
    queryFn: () => notificationsApi.settings(),
  });
}

/**
 * Saves the switches, then (un)schedules the reminders on the phone; the
 * result says whether the phone refused the notifications.
 */
export function useSaveNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: NotificationSettingsInput) => {
      const settings = await notificationsApi.saveSettings(body);
      return { settings, reminders: await syncReminders(settings) };
    },
    onMutate: (body) => {
      const previous = queryClient.getQueryData(notificationKeys.settings);
      queryClient.setQueryData(notificationKeys.settings, {
        ...(previous ?? {}),
        ...body,
      });
      return { previous };
    },
    onError: (_error, _body, context) =>
      queryClient.setQueryData(notificationKeys.settings, context?.previous),
    onSuccess: ({ settings }) =>
      queryClient.setQueryData(notificationKeys.settings, settings),
  });
}
