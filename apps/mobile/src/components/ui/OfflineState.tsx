import { useTranslation } from 'react-i18next';

import { statePhotos } from '@/theme/photos';

import { StateView } from './StateView';

/**
 * "Problème de connexion": the server cannot be reached. "Continuer hors
 * ligne" only shows up where the screen still has something to display.
 */
export function OfflineState({
  onRetry,
  retrying,
  onContinue,
}: {
  onRetry: () => void;
  retrying?: boolean;
  onContinue?: () => void;
}) {
  const { t } = useTranslation();
  return (
    <StateView
      image={statePhotos.offline}
      title={t('states.offline.title')}
      body={t('states.offline.body')}
      primary={{
        label: t('states.offline.retry'),
        onPress: onRetry,
        loading: retrying,
      }}
      secondary={
        onContinue
          ? { label: t('states.offline.offlineMode'), onPress: onContinue }
          : undefined
      }
    />
  );
}
