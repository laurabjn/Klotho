import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

import { PermissionScreen } from '@/components/ui/PermissionScreen';
import { statePhotos } from '@/theme/photos';

/**
 * The location was refused for good: only the phone settings can grant it
 * now, or the city is entered by hand.
 */
export function LocationBlockedScreen({
  visible,
  onManual,
}: {
  visible: boolean;
  /** Closes the screen; the city search is then shown. */
  onManual: () => void;
}) {
  const { t } = useTranslation();
  return (
    <PermissionScreen
      visible={visible}
      image={statePhotos.location}
      title={t('states.location.title')}
      body={t('states.location.body')}
      primary={{ label: t('states.location.manual'), onPress: onManual }}
      secondary={{
        label: t('states.location.settings'),
        onPress: () => {
          onManual();
          void Linking.openSettings();
        },
      }}
      onClose={onManual}
    />
  );
}
