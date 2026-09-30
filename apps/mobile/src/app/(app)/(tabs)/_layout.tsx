import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { SplashView } from '@/components/brand/SplashView';
import { useStyleProfile } from '@/features/preferences/hooks/useStyleProfile';
import { colors, fonts } from '@/theme/tokens';

type IconProps = { color: ColorValue; focused: boolean };

function TabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.icon}>
      {children}
      {/* Small dot under the active tab, as on the mockups. */}
      <View style={[styles.dot, focused && styles.dotActive]} />
    </View>
  );
}

function ionicon(
  outline: ComponentProps<typeof Ionicons>['name'],
  filled: ComponentProps<typeof Ionicons>['name'],
) {
  return function TabBarIcon({ color, focused }: IconProps) {
    return (
      <TabIcon focused={focused}>
        <Ionicons
          name={focused ? filled : outline}
          size={24}
          color={color as string}
        />
      </TabIcon>
    );
  };
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const profile = useStyleProfile();

  // The onboarding is offered once, until it is completed or skipped. If the
  // profile cannot be loaded (offline), the app stays usable.
  if (profile.isPending) {
    return <SplashView />;
  }
  if (profile.data && !profile.data.onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#6B5148',
        tabBarLabelStyle: styles.label,
        tabBarStyle: styles.bar,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ionicon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: t('tabs.wardrobe'),
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MaterialCommunityIcons
                name="hanger"
                size={25}
                color={color as string}
              />
            </TabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="inspirations"
        options={{
          title: t('tabs.inspirations'),
          tabBarIcon: ionicon('sparkles-outline', 'sparkles'),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('tabs.calendar'),
          tabBarIcon: ionicon('calendar-clear-outline', 'calendar-clear'),
        }}
      />
      <Tabs.Screen
        name="me"
        options={{
          title: t('tabs.me'),
          tabBarIcon: ionicon('person-outline', 'person'),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  label: { fontFamily: fonts.serif, fontSize: 12 },
  icon: { alignItems: 'center', gap: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'transparent' },
  dotActive: { backgroundColor: colors.primary },
});
