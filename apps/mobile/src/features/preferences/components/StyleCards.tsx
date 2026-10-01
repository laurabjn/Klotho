import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { STYLES, type Style } from '@klotho/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { styleIcons } from '@/theme/icons';
import { stylePhotos } from '@/theme/photos';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

/** "Choisis tes styles" shows the first nine, like the mockup. */
const FEATURED = 9;

interface StyleCardsProps {
  value: Style[];
  onChange: (value: Style[]) => void;
}

/** Photo cards of the "Choisis tes styles" / "Tous les styles" mockups. */
export function StyleCards({ value, onChange }: StyleCardsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded
    ? STYLES
    : STYLES.filter((style, i) => i < FEATURED || value.includes(style));

  const toggle = (style: Style) =>
    onChange(
      value.includes(style)
        ? value.filter((s) => s !== style)
        : [...value, style],
    );

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {shown.map((style) => (
          <View key={style} style={styles.cell}>
            <StyleCard
              style={style}
              label={t(`wardrobe.styles.${style}`)}
              selected={value.includes(style)}
              onPress={() => toggle(style)}
            />
          </View>
        ))}
      </View>
      <Button
        variant="link"
        label={
          expanded ? t('wardrobe.form.seeLess') : t('onboarding.styles.seeAll')
        }
        onPress={() => setExpanded(!expanded)}
      />
    </View>
  );
}

export function StyleCard({
  style,
  label,
  selected,
  onPress,
}: {
  style: Style;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const photo = stylePhotos[style];
  const tint = selected ? colors.onPrimary : colors.title;
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.photo}>
        {photo ? (
          <Image
            source={photo}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <MaterialCommunityIcons
              name={styleIcons[style]}
              size={36}
              color={colors.primary}
            />
          </View>
        )}
        {selected && (
          <View style={styles.check}>
            <Ionicons name="checkmark" size={16} color={colors.onPrimary} />
          </View>
        )}
      </View>
      <View style={styles.label}>
        <MaterialCommunityIcons
          name={styleIcons[style]}
          size={16}
          color={tint}
        />
        <AppText numberOfLines={2} style={[styles.labelText, { color: tint }]}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const GAP = spacing.sm + 2;

const styles = StyleSheet.create({
  container: { gap: spacing.sm, alignItems: 'center' },
  grid: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -GAP / 2,
  },
  // Just under 1/3, so that rounding never pushes a card to the next row.
  cell: { width: '33.2%', padding: GAP / 2 },
  card: {
    padding: 4,
    borderRadius: radii.input,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  cardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pressed: { opacity: 0.85 },
  photo: {
    aspectRatio: 1,
    overflow: 'hidden',
    borderRadius: radii.input - 4,
    backgroundColor: colors.primaryLight,
  },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  check: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.onPrimary,
    backgroundColor: colors.primary,
  },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: 2,
  },
  labelText: {
    flexShrink: 1,
    textAlign: 'center',
    fontFamily: fonts.serif,
    fontSize: 15,
    lineHeight: 18,
  },
});
