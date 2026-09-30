import { Ionicons } from '@expo/vector-icons';
import { PHOTOS_MAX_PER_ITEM } from '@klotho/shared';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { FormError } from '@/components/ui/FormError';
import { colors, radii, spacing } from '@/theme/tokens';

import type { LocalPhoto } from './pick-photo';
import { usePhotoSource } from './usePhotoSource';

interface LocalPhotoGridProps {
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
}

/**
 * Photos chosen in the add flow, before the piece exists: they are uploaded
 * right after its creation. The first one is the main photo.
 */
export function LocalPhotoGrid({ photos, onChange }: LocalPhotoGridProps) {
  const { t } = useTranslation();
  const source = usePhotoSource((photo) => onChange([...photos, photo]));
  const canAdd = photos.length < PHOTOS_MAX_PER_ITEM;

  const makeMain = (index: number) =>
    onChange([photos[index]!, ...photos.filter((_, i) => i !== index)]);
  const remove = (index: number) =>
    onChange(photos.filter((_, i) => i !== index));

  return (
    <View style={styles.container}>
      <AppText>{t('wardrobe.photos.stepHint')}</AppText>
      <View style={styles.grid}>
        {photos.map((photo, index) => (
          <View key={photo.uri} style={styles.cell}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                index === 0
                  ? `${t('wardrobe.photos.photoOf', { index: 1, count: photos.length })}, ${t('wardrobe.photos.main')}`
                  : `${t('wardrobe.photos.photoOf', { index: index + 1, count: photos.length })}, ${t('wardrobe.photos.setMain')}`
              }
              onPress={() => makeMain(index)}
              style={styles.tile}
            >
              <Image
                source={{ uri: photo.uri }}
                style={styles.image}
                contentFit="cover"
              />
              {index === 0 && (
                <View style={styles.mainBadge}>
                  <AppText variant="hint" style={styles.mainText}>
                    {t('wardrobe.photos.main')}
                  </AppText>
                </View>
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('wardrobe.photos.remove')}
              hitSlop={10}
              onPress={() => remove(index)}
              style={styles.remove}
            >
              <Ionicons name="close" size={16} color={colors.title} />
            </Pressable>
          </View>
        ))}
        {canAdd && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('wardrobe.photos.add')}
            onPress={source.open}
            disabled={source.busy}
            style={[styles.cell, styles.tile, styles.add]}
          >
            {source.busy ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons
                  name="camera-outline"
                  size={30}
                  color={colors.primary}
                />
                <AppText variant="hint" center>
                  {t('wardrobe.photos.add')}
                </AppText>
              </>
            )}
          </Pressable>
        )}
      </View>
      <AppText variant="hint">
        {photos.length > 1
          ? t('wardrobe.photos.mainHint')
          : t('wardrobe.photos.limit', { max: PHOTOS_MAX_PER_ITEM })}
      </AppText>
      <FormError message={source.error} />
      {source.element}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  cell: { width: '47%' },
  tile: {
    aspectRatio: 3 / 4,
    borderRadius: radii.card - 4,
    overflow: 'hidden',
    backgroundColor: colors.input,
  },
  image: { flex: 1 },
  add: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  mainBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  mainText: { color: colors.onPrimary },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 28,
    height: 28,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 249, 245, 0.92)',
  },
});
