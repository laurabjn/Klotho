import {
  listNotificationsQuerySchema,
  notificationSettingsSchema,
} from './schemas';

describe('notification schemas', () => {
  it('reminds every morning at 8 by default, without news', () => {
    expect(notificationSettingsSchema.parse({})).toEqual({
      tips: true,
      reminders: true,
      news: false,
      reminderTime: '08:00',
    });
    expect(
      notificationSettingsSchema.safeParse({ reminderTime: '24:00' }).success,
    ).toBe(false);
  });

  it('lists every notification by default', () => {
    expect(listNotificationsQuerySchema.parse({})).toEqual({
      category: 'all',
      page: 1,
      pageSize: 20,
    });
  });
});
