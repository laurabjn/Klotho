import { PHOTOS_MAX_PER_ITEM, type WardrobeItem } from '@klotho/shared';
import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
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

/** Swipeable photos of an item, with add / set main / delete actions. */
export function WardrobePhotoCarousel({ item }: { item: WardrobeItem }) {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const pageWidth = width - SCREEN_PADDING * 2;
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
    <View style={styles.container}>
      {photos.length === 0 ? (
        <ItemVisual
          category={item.category}
          color={item.primaryColor}
          size="hero"
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
});
