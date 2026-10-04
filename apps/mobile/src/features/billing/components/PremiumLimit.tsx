import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { StateView } from '@/components/ui/StateView';
import { ApiError } from '@/lib/api/errors';
import { photos } from '@/theme/photos';

/** A limit of the free plan was reached (the API answered 402). */
export function isPlanLimit(
  error: unknown,
  code: 'billing.pieceLimit' | 'billing.generationLimit',
): boolean {
  return error instanceof ApiError && error.code === code;
}

/** "Ton dressing est plein" / "Plus de tenues cette semaine". */
export function PremiumLimit({
  title,
  body,
  onLater,
}: {
  title: string;
  body: string;
  onLater: () => void;
}) {
  const { t } = useTranslation();
  return (
    <StateView
      image={photos.welcome.source}
      imageRatio={photos.welcome.ratio}
      title={title}
      body={body}
      primary={{
        label: t('billing.limits.upgrade'),
        onPress: () => router.push('/premium'),
      }}
      link={{ label: t('billing.limits.later'), onPress: onLater }}
    />
  );
}
