import { useTranslation } from 'react-i18next';

import { ComingSoonScreen } from '@/features/navigation/ComingSoonScreen';

export default function CalendarTab() {
  const { t } = useTranslation();
  return (
    <ComingSoonScreen
      title={t('tabs.calendar')}
      icon="calendar-clear-outline"
    />
  );
}
