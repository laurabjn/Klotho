import type { WardrobeItem } from '@klotho/shared';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { HeartButton } from '@/components/ui/HeartButton';
import { spacing } from '@/theme/tokens';

import { useToggleItemFavorite } from '../hooks/useWardrobe';

/** The heart in the corner of a piece's photo ("Mes pièces favorites"). */
export function PieceHeart({
  item,
  size,
}: {
  item: Pick<WardrobeItem, 'id' | 'isFavorite'>;
  size?: number;
}) {
  const { t } = useTranslation();
  const favorite = useToggleItemFavorite(item.id);
  return (
    <HeartButton
      on={item.isFavorite}
      label={
        item.isFavorite
          ? t('wardrobe.favorites.remove')
          : t('wardrobe.favorites.add')
      }
      onPress={() => favorite.mutate(!item.isFavorite)}
      size={size}
      style={styles.corner}
    />
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', top: spacing.xs, right: spacing.xs },
});
