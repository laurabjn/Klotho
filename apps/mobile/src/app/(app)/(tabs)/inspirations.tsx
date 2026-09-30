import { useTranslation } from 'react-i18next';

import { ComingSoonScreen } from '@/features/navigation/ComingSoonScreen';

export default function InspirationsTab() {
  const { t } = useTranslation();
  return (
    <ComingSoonScreen title={t('tabs.inspirations')} icon="sparkles-outline" />
  );
}
