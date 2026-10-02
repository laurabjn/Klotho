import { Stack } from 'expo-router';

import { useNotificationSetup } from '@/features/notifications/lib/useNotificationSetup';

export default function AppGroupLayout() {
  useNotificationSetup();
  return <Stack screenOptions={{ headerShown: false }} />;
}
