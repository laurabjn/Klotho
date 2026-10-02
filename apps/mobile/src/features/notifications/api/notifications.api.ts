import type {
  AppNotification,
  ListNotificationsQueryInput,
  NotificationSettings,
  NotificationSettingsInput,
  Page,
} from '@klotho/shared';

import { request } from '@/lib/api/http';

export const notificationsApi = {
  list: ({
    category = 'all',
    page = 1,
    pageSize = 20,
  }: ListNotificationsQueryInput) =>
    request<Page<AppNotification>>(
      `/notifications?category=${category}&page=${page}&pageSize=${pageSize}`,
      { auth: true },
    ),
  unreadCount: () =>
    request<{ count: number }>('/notifications/unread-count', { auth: true }),
  read: (id: string) =>
    request<void>(`/notifications/${id}/read`, { method: 'POST', auth: true }),
  readAll: () =>
    request<void>('/notifications/read-all', { method: 'POST', auth: true }),
  remove: (id: string) =>
    request<void>(`/notifications/${id}`, { method: 'DELETE', auth: true }),
  settings: () =>
    request<NotificationSettings>('/notifications/settings', { auth: true }),
  saveSettings: (body: NotificationSettingsInput) =>
    request<NotificationSettings>('/notifications/settings', {
      method: 'PUT',
      body,
      auth: true,
    }),
};
