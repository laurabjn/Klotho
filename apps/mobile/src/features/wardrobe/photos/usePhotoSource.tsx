import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { spacing } from '@/theme/tokens';

import { pickPhoto, type LocalPhoto, type PhotoSource } from './pick-photo';

/**
 * "Prendre une photo / Choisir dans la galerie" sheet. Permissions are asked
 * only at that moment; a refusal is explained, with a shortcut to the settings.
 */
export function usePhotoSource(onPicked: (photo: LocalPhoto) => void) {
  const { t } = useTranslation();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [denied, setDenied] = useState<PhotoSource | null>(null);
  const [busy, setBusy] = useState(false);

  const choose = async (source: PhotoSource) => {
    setSheetVisible(false);
    setBusy(true);
    try {
      const result = await pickPhoto(source);
      if (result.status === 'picked') onPicked(result.photo);
      if (result.status === 'denied') setDenied(source);
    } finally {
      setBusy(false);
    }
  };

  const element = (
    <>
      <BottomSheet
        visible={sheetVisible}
        title={t('wardrobe.photos.sourceTitle')}
        onClose={() => setSheetVisible(false)}
      >
        <View style={styles.options}>
          <Button
            variant="secondary"
            icon="camera-outline"
            label={t('wardrobe.photos.camera')}
            onPress={() => void choose('camera')}
          />
          <Button
            variant="secondary"
            icon="images-outline"
            label={t('wardrobe.photos.library')}
            onPress={() => void choose('library')}
          />
        </View>
      </BottomSheet>
      <ConfirmDialog
        visible={denied !== null}
        icon={denied === 'camera' ? 'camera-outline' : 'images-outline'}
        title={
          denied === 'camera'
            ? t('wardrobe.photos.permissionCameraTitle')
            : t('wardrobe.photos.permissionLibraryTitle')
        }
        message={t('wardrobe.photos.permissionBody')}
        confirmLabel={t('wardrobe.photos.openSettings')}
        cancelLabel={t('common.cancel')}
        onConfirm={() => {
          setDenied(null);
          void Linking.openSettings();
        }}
        onCancel={() => setDenied(null)}
      />
    </>
  );

  return { open: () => setSheetVisible(true), busy, element };
}

const styles = StyleSheet.create({
  options: { gap: spacing.md, paddingBottom: spacing.sm },
});
