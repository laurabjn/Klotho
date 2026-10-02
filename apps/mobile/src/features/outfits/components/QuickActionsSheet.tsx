import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import type { IconName } from '@/theme/icons';
import { colors, fonts, radii, spacing } from '@/theme/tokens';

export type QuickAction = 'variant' | 'plan' | 'share' | 'favorite' | 'delete';

/** "Actions rapides" of a look, as on the mockup. */
export function QuickActionsSheet({
  visible,
  isFavorite,
  onAction,
  onClose,
}: {
  visible: boolean;
  isFavorite: boolean;
  onAction: (action: QuickAction) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const rows: {
    action: QuickAction;
    icon: IconName;
    title: string;
    hint: string;
  }[] = [
    {
      action: 'variant',
      icon: 'content-copy',
      title: t('outfits.planning.quick.variant'),
      hint: t('outfits.planning.quick.variantHint'),
    },
    {
      action: 'plan',
      icon: 'calendar-blank-outline',
      title: t('outfits.planning.quick.plan'),
      hint: t('outfits.planning.quick.planHint'),
    },
    {
      action: 'share',
      icon: 'export-variant',
      title: t('outfits.planning.quick.share'),
      hint: t('outfits.planning.quick.shareHint'),
    },
    {
      action: 'favorite',
      icon: isFavorite ? 'heart' : 'heart-outline',
      title: isFavorite
        ? t('outfits.planning.quick.unfavorite')
        : t('outfits.planning.quick.favorite'),
      hint: t('outfits.planning.quick.favoriteHint'),
    },
  ];

  return (
    <BottomSheet
      visible={visible}
      title={t('outfits.planning.quick.title')}
      onClose={onClose}
      footer={
        <Button
          variant="secondary"
          decorated={false}
          label={t('outfits.planning.quick.cancel')}
          onPress={onClose}
        />
      }
    >
      <View style={styles.rows}>
        {rows.map((row) => (
          <Row key={row.action} {...row} onPress={() => onAction(row.action)} />
        ))}
        <Row
          action="delete"
          icon="trash-can-outline"
          title={t('outfits.planning.quick.delete')}
          hint={t('outfits.planning.quick.deleteHint')}
          danger
          onPress={() => onAction('delete')}
        />
      </View>
    </BottomSheet>
  );
}

function Row({
  icon,
  title,
  hint,
  danger = false,
  onPress,
}: {
  action: QuickAction;
  icon: IconName;
  title: string;
  hint: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const color = danger ? colors.link : colors.title;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        danger && styles.rowDanger,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <View style={styles.text}>
        <AppText style={[styles.title, { color }]}>{title}</AppText>
        <AppText variant="overline" numberOfLines={2}>
          {hint}
        </AppText>
      </View>
      {!danger && (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rows: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowDanger: { backgroundColor: colors.primaryLight },
  pressed: { opacity: 0.7 },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.serif, fontSize: 18, lineHeight: 22 },
});
