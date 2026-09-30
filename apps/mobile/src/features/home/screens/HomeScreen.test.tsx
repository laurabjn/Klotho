import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { authApi } from '@/features/auth/api/auth.api';
import { signIn, useAuthStore } from '@/features/auth/store/auth.store';
import { renderWithProviders, session } from '@/testing/render';

import { HomeScreen } from './HomeScreen';

jest.mock('@/features/auth/api/auth.api');
const api = jest.mocked(authApi);

describe('HomeScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await signIn(session);
  });

  it('greets the user by first name', async () => {
    await renderWithProviders(<HomeScreen />);

    expect(
      screen.getByRole('header', { name: 'Bonjour Laura' }),
    ).toBeOnTheScreen();
  });

  it('asks for confirmation, then signs out', async () => {
    api.logout.mockResolvedValue(undefined);
    await renderWithProviders(<HomeScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Se déconnecter' }),
    );
    expect(screen.getByText('Se déconnecter ?')).toBeOnTheScreen();
    expect(useAuthStore.getState().status).toBe('signedIn');

    const buttons = screen.getAllByRole('button', { name: 'Se déconnecter' });
    await fireEvent.press(buttons[buttons.length - 1]!);

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('signedOut'),
    );
    expect(api.logout).toHaveBeenCalledWith('refresh-1');
  });

  it('keeps the session when the user cancels', async () => {
    await renderWithProviders(<HomeScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Se déconnecter' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.queryByText('Se déconnecter ?')).not.toBeOnTheScreen();
    expect(useAuthStore.getState().status).toBe('signedIn');
  });
});
