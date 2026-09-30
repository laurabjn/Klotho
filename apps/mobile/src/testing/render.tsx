import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import i18n from '@/i18n';

/** Renders with a fresh query client, in French (the reference locale). */
export async function renderWithProviders(ui: ReactElement) {
  await i18n.changeLanguage('fr');
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>,
  );
}

export const session = {
  user: {
    id: 'user-1',
    email: 'laura@example.com',
    firstName: 'Laura',
    avatarUrl: null,
    createdAt: '2026-10-01T08:00:00.000Z',
  },
  tokens: {
    accessToken: 'access-1',
    accessTokenExpiresIn: 900,
    refreshToken: 'refresh-1',
  },
};
