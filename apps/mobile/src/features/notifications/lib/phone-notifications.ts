import Constants, { ExecutionEnvironment } from 'expo-constants';
import type * as NotificationsModule from 'expo-notifications';

/**
 * expo-notifications fails as soon as it is loaded in Expo Go on Android
 * (SDK 53+): it is only loaded in the installed app (development or beta
 * build), and the phone reminders are simply unavailable in Expo Go.
 */
export const inExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let loaded: typeof NotificationsModule | null | undefined;

export function phoneNotifications(): typeof NotificationsModule | null {
  if (loaded === undefined)
    loaded = inExpoGo
      ? null
      : // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require('expo-notifications') as typeof NotificationsModule);
  return loaded;
}
