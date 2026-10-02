import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PermissionScreen } from '@/components/ui/PermissionScreen';
import { statePhotos } from '@/theme/photos';
import { spacing } from '@/theme/tokens';

import {
  permissionState,
  pickPhoto,
  type LocalPhoto,
  type PhotoSource,
} from './pick-photo';

/** Duration of the closing animation of our sheets and dialogs. */
const MODAL_CLOSE_MS = 350;

/**
 * "Prendre une photo / Choisir dans la galerie" sheet. Permissions are asked
 * only at that moment; a refusal is explained, with a shortcut to the settings.
 */
export function usePhotoSource(onPicked: (photo: LocalPhoto) => void) {
  const { t } = useTranslation();
  const [sheetVisible, setSheetVisible] = useState(false);
  /** Our explanation, shown before the (unstylable) system permission dialog. */
  const [primer, setPrimer] = useState<PhotoSource | null>(null);
  const [denied, setDenied] = useState<PhotoSource | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const run = async (source: PhotoSource) => {
    setBusy(true);
    try {
      const result = await pickPhoto(source);
      if (result.status === 'picked') onPicked(result.photo);
      // A first "no" is respected; only a definitive one needs the settings.
      if (result.status === 'denied' && !result.canAskAgain) setDenied(source);
    } catch (error) {
      // Visible in the Expo terminal, to diagnose device-specific failures.
      console.warn('[photos] picking failed', error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const start = async (source: PhotoSource) => {
    try {
      const state = await permissionState(source);
      if (state === 'granted') return void run(source);
      if (state === 'ask') return setPrimer(source);
      setDenied(source);
    } catch (error) {
      console.warn('[photos] permission check failed', error);
      setFailed(true);
    }
  };

  // Opening a system screen (camera, gallery, permission) while one of our
  // modals is still closing can be ignored by the OS: wait for the animation.
  const afterClosing = (action: () => void) =>
    setTimeout(action, MODAL_CLOSE_MS);

  const choose = (source: PhotoSource) => {
    setSheetVisible(false);
    setFailed(false);
    afterClosing(() => void start(source));
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
            onPress={() => choose('camera')}
          />
          <Button
            variant="secondary"
            icon="images-outline"
            label={t('wardrobe.photos.library')}
            onPress={() => choose('library')}
          />
        </View>
      </BottomSheet>
      <PermissionScreen
        visible={primer !== null}
        image={statePhotos.photos}
        title={
          primer === 'camera'
            ? t('wardrobe.photos.permissionCameraTitle')
            : t('wardrobe.photos.permissionLibraryTitle')
        }
        body={t('wardrobe.photos.primerBody')}
        primary={{
          label: t('wardrobe.photos.allow'),
          onPress: () => {
            const source = primer;
            setPrimer(null);
            if (source) afterClosing(() => void run(source));
          },
        }}
        secondary={{
          label: t('wardrobe.photos.later'),
          onPress: () => setPrimer(null),
        }}
        onClose={() => setPrimer(null)}
      />
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

  return {
    open: () => setSheetVisible(true),
    busy,
    /** Translated message when the photo could not be taken or read. */
    error: failed ? t('wardrobe.photos.pickFailed') : null,
    element,
  };
}

const styles = StyleSheet.create({
  options: { gap: spacing.md, paddingBottom: spacing.sm },
});
