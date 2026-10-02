import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';

const CLEAR = 'rgba(251, 247, 242, 0)';

interface Action {
  label: string;
  onPress: () => void;
  loading?: boolean;
}

/**
 * The state screens of the mockups (empty dressing, no connection, no
 * result…): an illustration fading into the page, a title, a few words,
 * then the main action, a second one and a discreet link.
 */
export function StateView({
  image,
  imageRatio = 1.4,
  title,
  body,
  primary,
  secondary,
  link,
  children,
}: {
  image?: ImageSource;
  /** Width / height of the illustration. */
  imageRatio?: number;
  title: string;
  body?: string;
  primary?: Action;
  secondary?: Action;
  link?: Action;
  /** Extra content between the text and the buttons. */
  children?: ReactNode;
}) {
  return (
    <View style={styles.container}>
      {image && (
        <View
          style={[styles.art, { aspectRatio: imageRatio }]}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Image
            source={image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <LinearGradient
            colors={[CLEAR, CLEAR, colors.background]}
            locations={[0, 0.7, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      )}
      <View style={styles.text}>
        <AppText variant="title" center style={styles.title}>
          {title}
        </AppText>
        {body ? (
          <AppText center style={styles.body}>
            {body}
          </AppText>
        ) : null}
      </View>
      {children}
      {(primary || secondary || link) && (
        <View style={styles.actions}>
          {primary && (
            <Button
              decorated={false}
              label={primary.label}
              loading={primary.loading}
              onPress={primary.onPress}
            />
          )}
          {secondary && (
            <Button
              variant="outline"
              decorated={false}
              label={secondary.label}
              loading={secondary.loading}
              onPress={secondary.onPress}
            />
          )}
          {link && (
            <Button
              variant="link"
              decorated={false}
              label={link.label}
              onPress={link.onPress}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, alignItems: 'stretch' },
  art: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radii.card,
  },
  text: { gap: spacing.sm, paddingHorizontal: spacing.sm },
  title: { fontSize: 28, lineHeight: 33 },
  body: { fontSize: 16, lineHeight: 22 },
  actions: { gap: spacing.sm, alignItems: 'stretch' },
});
