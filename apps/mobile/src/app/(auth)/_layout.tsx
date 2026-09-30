import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'login' };

export default function AuthGroupLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
