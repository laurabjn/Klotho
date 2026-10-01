import type { Outfit } from '@klotho/shared';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { HeartButton } from '@/components/ui/HeartButton';
import { spacing } from '@/theme/tokens';

import { useToggleOutfitFavorite } from '../hooks/useOutfits';

/** The heart in the corner of a look ("Mes favoris"). */
export function OutfitHeart({
  outfit,
  size,
}: {
  outfit: Pick<Outfit, 'id' | 'isFavorite'>;
  size?: number;
}) {
  const { t } = useTranslation();
  const favorite = useToggleOutfitFavorite(outfit.id);
  return (
    <HeartButton
      on={outfit.isFavorite}
      label={
        outfit.isFavorite
          ? t('outfits.details.unfavorite')
          : t('outfits.details.favorite')
      }
      onPress={() => favorite.mutate(!outfit.isFavorite)}
      size={size}
      style={styles.corner}
    />
  );
}

const styles = StyleSheet.create({
  corner: { position: 'absolute', top: spacing.sm, right: spacing.sm },
});
