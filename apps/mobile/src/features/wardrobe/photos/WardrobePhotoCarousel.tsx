import { PHOTOS_MAX_PER_ITEM, type WardrobeItem } from '@klotho/shared';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormError } from '@/components/ui/FormError';
import { errorMessageKey } from '@/lib/api/errors';
import { colors, radii, spacing } from '@/theme/tokens';

import { ItemVisual } from '../components/ItemVisual';
import {
  useAddPhoto,
  useDeletePhoto,
  useSetMainPhoto,
} from '../hooks/usePhotos';
import { usePhotoSource } from './usePhotoSource';

/** Horizontal padding of the details screen, to size the pages. */
const SCREEN_PADDING = spacing.xl;

/**
 * Swipeable photos of an item, with add / set main / delete actions. Given a
 * `width` (photo beside the details, as on the mockup), the actions become
 * small round buttons under the photo.
 */
export function WardrobePhotoCarousel({
  item,
  width: fixedWidth,
}: {
  item: WardrobeItem;
  width?: number;
}) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const pageWidth = fixedWidth ?? width - SCREEN_PADDING * 2;
  const narrow = fixedWidth !== undefined;
  const [index, setIndex] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const add = useAddPhoto(item.id);
  const remove = useDeletePhoto(item.id);
  const setMain = useSetMainPhoto(item.id);
  const source = usePhotoSource((photo) => add.mutate(photo));

  const photos = item.photos;
  const current = photos[Math.min(index, photos.length - 1)];
  const canAdd = photos.length < PHOTOS_MAX_PER_ITEM;
  const error = add.error ?? remove.error ?? setMain.error;

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    setIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));

  return (
    <View style={[styles.container, narrow && { width: pageWidth }]}>
      {photos.length === 0 ? (
        <ItemVisual
          category={item.category}
          color={item.primaryColor}
          size={narrow ? 'portrait' : 'hero'}
        />
      ) : (
        <View>
          <FlatList
            data={photos}
            keyExtractor={(photo) => photo.id}
            horizontal
            pagingEnabled
            // At most a handful of photos: render them all at once.
            initialNumToRender={PHOTOS_MAX_PER_ITEM}
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScroll}
            renderItem={({ item: photo, index: i }) => (
              <Image
                source={{ uri: photo.url, cacheKey: photo.id }}
                contentFit="cover"
                transition={150}
                accessible
                accessibilityLabel={t('wardrobe.photos.photoOf', {
                  index: i + 1,
                  count: photos.length,
                })}
                style={[styles.photo, { width: pageWidth }]}
              />
            )}
          />
          {current?.isMain && (
            <View style={styles.mainBadge}>
              <AppText variant="hint" style={styles.mainText}>
                {t('wardrobe.photos.main')}
              </AppText>
            </View>
          )}
          {photos.length > 1 && (
            <View
              style={styles.dots}
              importantForAccessibility="no-hide-descendants"
            >
              {photos.map((photo, i) => (
                <View
                  key={photo.id}
                  style={[styles.dot, i === index && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {narrow ? (
        <View style={styles.iconActions}>
          {canAdd && (
            <IconAction
              icon="camera-outline"
              label={t('wardrobe.photos.add')}
              busy={add.isPending || source.busy}
              onPress={source.open}
            />
          )}
          {current && !current.isMain && (
            <IconAction
              icon="star-outline"
              label={t('wardrobe.photos.setMain')}
              busy={setMain.isPending}
              onPress={() => setMain.mutate(current.id)}
            />
          )}
          {current && (
            <IconAction
              icon="trash-outline"
              label={t('wardrobe.photos.delete')}
              onPress={() => setConfirmDelete(true)}
            />
          )}
        </View>
      ) : (
        <View style={styles.actions}>
          {canAdd && (
            <View style={styles.flex}>
              <Button
                variant="secondary"
                icon="camera-outline"
                label={t('wardrobe.photos.add')}
                loading={add.isPending || source.busy}
                onPress={source.open}
              />
            </View>
          )}
          {current && !current.isMain && (
            <View style={styles.flex}>
              <Button
                variant="secondary"
                icon="star-outline"
                label={t('wardrobe.photos.setMain')}
                loading={setMain.isPending}
                onPress={() => setMain.mutate(current.id)}
              />
            </View>
          )}
          {current && (
            <Button
              variant="link"
              icon="trash-outline"
              decorated={false}
              label={t('wardrobe.photos.delete')}
              onPress={() => setConfirmDelete(true)}
            />
          )}
        </View>
      )}
      <FormError
        message={
          error
            ? t(errorMessageKey(error) as 'apiErrors.unknown')
            : source.error
        }
      />
      {source.element}
      <ConfirmDialog
        visible={confirmDelete}
        icon="trash-outline"
        title={t('wardrobe.photos.deleteTitle')}
        message={t('wardrobe.photos.deleteBody')}
        confirmLabel={t('wardrobe.photos.delete')}
        cancelLabel={t('common.cancel')}
        loading={remove.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!current) return;
          remove.mutate(current.id, {
            onSettled: () => {
              setConfirmDelete(false);
              setIndex(0);
            },
          });
        }}
      />
    </View>
  );
}

function IconAction({
  icon,
  label,
  busy = false,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  busy?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy }}
      disabled={busy}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.iconAction, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={20} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  photo: {
    aspectRatio: 3 / 4,
    borderRadius: radii.card,
    backgroundColor: colors.input,
  },
  mainBadge: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: colors.primary,
  },
  mainText: { color: colors.onPrimary },
  dots: {
    position: 'absolute',
    bottom: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(255, 249, 245, 0.8)',
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  flex: { flex: 1, minWidth: 150 },
  iconActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconAction: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.6 },
});
