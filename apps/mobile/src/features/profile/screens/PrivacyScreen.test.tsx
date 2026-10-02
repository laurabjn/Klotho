import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import { authApi } from '@/features/auth/api/auth.api';
import { signIn, useAuthStore } from '@/features/auth/store/auth.store';
import { ApiError } from '@/lib/api/errors';
import { renderWithProviders, session } from '@/testing/render';

import { PrivacyScreen } from './PrivacyScreen';

jest.mock('@/features/auth/api/auth.api');
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));

const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));

describe('PrivacyScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await signIn(session);
  });

  it('explains what is stored and how the location is used', async () => {
    await renderWithProviders(<PrivacyScreen />);

    expect(screen.getByText('Ce que Klotho enregistre')).toBeOnTheScreen();
    expect(screen.getByText('Ta position')).toBeOnTheScreen();
    expect(screen.getByText('Mentions légales')).toBeOnTheScreen();
  });

  it('deletes the account with the password, then signs out', async () => {
    jest.mocked(authApi.deleteAccount).mockResolvedValue(undefined);
    await renderWithProviders(<PrivacyScreen />);

    await press('Supprimer mon compte');
    expect(
      screen.getByText('Cette action est irréversible.'),
    ).toBeOnTheScreen();
    const confirm = screen.getByRole('button', {
      name: 'Oui, supprimer mon compte',
    });
    expect(confirm.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.changeText(
      screen.getByLabelText('Mot de passe'),
      'Klotho2026!',
    );
    await press('Oui, supprimer mon compte');

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('signedOut'),
    );
    expect(authApi.deleteAccount).toHaveBeenCalledWith('Klotho2026!');
  });

  it('keeps the account when the password is wrong', async () => {
    jest
      .mocked(authApi.deleteAccount)
      .mockRejectedValue(new ApiError(403, 'users.invalidPassword'));
    await renderWithProviders(<PrivacyScreen />);

    await press('Supprimer mon compte');
    await fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'wrong');
    await press('Oui, supprimer mon compte');

    expect(
      await screen.findByText('Mot de passe incorrect.'),
    ).toBeOnTheScreen();
    expect(useAuthStore.getState().status).toBe('signedIn');
  });

  it('forgets the password when the deletion is cancelled', async () => {
    await renderWithProviders(<PrivacyScreen />);

    await press('Supprimer mon compte');
    await fireEvent.changeText(screen.getByLabelText('Mot de passe'), 'secret');
    await press('Annuler');
    await press('Supprimer mon compte');

    expect(screen.getByLabelText('Mot de passe').props.value).toBe('');
    expect(authApi.deleteAccount).not.toHaveBeenCalled();
  });
});
