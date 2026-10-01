import type { StyleProfile } from '@klotho/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { authApi } from '@/features/auth/api/auth.api';
import { signIn, useAuthStore } from '@/features/auth/store/auth.store';
import { preferencesApi } from '@/features/preferences/api/preferences.api';
import { EMPTY_STYLE_PROFILE } from '@/features/preferences/hooks/useStyleProfile';
import { weatherApi } from '@/features/weather/api/weather.api';
import i18n from '@/i18n';
import { ApiError } from '@/lib/api/errors';
import { renderWithProviders, session } from '@/testing/render';

import { ChangeEmailScreen } from './ChangeEmailScreen';
import { ChangePasswordScreen } from './ChangePasswordScreen';
import { ConfirmEmailScreen } from './ConfirmEmailScreen';
import { EditProfileScreen } from './EditProfileScreen';
import { HelpScreen } from './HelpScreen';
import { SettingsScreen } from './SettingsScreen';
import { TermsScreen } from './TermsScreen';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    dismissTo: jest.fn(),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/features/auth/api/auth.api');
jest.mock('@/features/preferences/api/preferences.api');
jest.mock('@/features/weather/api/weather.api');

const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));

beforeEach(async () => {
  jest.clearAllMocks();
  mockParams = {};
  await signIn(session);
  await i18n.changeLanguage('fr');
  jest.mocked(weatherApi.settings).mockResolvedValue({
    locationMode: 'city',
    city: {
      name: 'Bruges',
      country: 'FR',
      region: null,
      latitude: 44.88,
      longitude: -0.61,
    },
    temperatureUnit: 'celsius',
  });
  jest.mocked(preferencesApi.get).mockResolvedValue({
    ...EMPTY_STYLE_PROFILE,
    preferredStyles: ['romantic'],
    preferredColors: ['powderPink'],
    onboardingCompleted: true,
  } as StyleProfile);
});

describe('SettingsScreen', () => {
  it('opens the account screens and shows the city', async () => {
    await renderWithProviders(<SettingsScreen />);

    expect(
      await screen.findByRole('button', { name: 'Localisation, Bruges, FR' }),
    ).toBeOnTheScreen();
    await press('Mon profil');
    expect(router.push).toHaveBeenCalledWith('/profile/edit');
    await press('Changer mon mot de passe');
    expect(router.push).toHaveBeenCalledWith('/account/password');
  });

  it('switches the language of the app', async () => {
    await renderWithProviders(<SettingsScreen />);

    await fireEvent.press(screen.getByRole('radio', { name: 'English' }));

    await waitFor(() => expect(i18n.language).toBe('en'));
    expect(await screen.findByText('Settings')).toBeOnTheScreen();
  });

  it('explains that the contact address comes soon', async () => {
    await renderWithProviders(<SettingsScreen />);

    await press('Nous contacter');

    expect(
      screen.getByText(/L’adresse de contact sera bientôt disponible/),
    ).toBeOnTheScreen();
  });
});

describe('EditProfileScreen', () => {
  it('saves the first name, the bio and the styles', async () => {
    jest.mocked(authApi.updateProfile).mockResolvedValue({
      ...session.user,
      firstName: 'Laura B.',
      bio: 'Romantique',
    });
    jest
      .mocked(preferencesApi.save)
      .mockImplementation((profile) =>
        Promise.resolve({ ...EMPTY_STYLE_PROFILE, ...profile } as StyleProfile),
      );
    await renderWithProviders(<EditProfileScreen />);

    await fireEvent.changeText(screen.getByLabelText('Prénom'), 'Laura B.');
    await fireEvent.changeText(screen.getByLabelText('Bio'), 'Romantique');
    await fireEvent.press(
      await screen.findByRole('checkbox', { name: 'Chic' }),
    );
    await press('Enregistrer les modifications');

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(authApi.updateProfile).toHaveBeenCalledWith({
      firstName: 'Laura B.',
      bio: 'Romantique',
    });
    expect(preferencesApi.save).toHaveBeenCalledWith(
      expect.objectContaining({ preferredStyles: ['romantic', 'chic'] }),
    );
    expect(useAuthStore.getState().user?.firstName).toBe('Laura B.');
  });
});

describe('ChangePasswordScreen', () => {
  it('changes the password and keeps a fresh session', async () => {
    jest.mocked(authApi.changePassword).mockResolvedValue(session);
    await renderWithProviders(<ChangePasswordScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Mot de passe actuel'),
      'Klotho2026!',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Nouveau mot de passe'),
      'Nouveau2026!',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Confirmer le nouveau mot de passe'),
      'Nouveau2026!',
    );
    await press('Enregistrer');

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        '/password-changed?from=settings',
      ),
    );
    expect(useAuthStore.getState().status).toBe('signedIn');
    expect(authApi.changePassword).toHaveBeenCalledWith({
      currentPassword: 'Klotho2026!',
      newPassword: 'Nouveau2026!',
    });
  });

  it('says when the current password is wrong', async () => {
    jest
      .mocked(authApi.changePassword)
      .mockRejectedValue(new ApiError(403, 'users.invalidPassword'));
    await renderWithProviders(<ChangePasswordScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Mot de passe actuel'),
      'faux',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Nouveau mot de passe'),
      'Nouveau2026!',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Confirmer le nouveau mot de passe'),
      'Nouveau2026!',
    );
    await press('Enregistrer');

    expect(
      await screen.findByText('Mot de passe incorrect.'),
    ).toBeOnTheScreen();
  });
});

describe('ChangeEmailScreen', () => {
  it('sends the confirmation link to the new address', async () => {
    jest.mocked(authApi.changeEmail).mockResolvedValue(undefined);
    jest.mocked(authApi.me).mockResolvedValue({
      ...session.user,
      pendingEmail: 'nouvelle@example.com',
    });
    await renderWithProviders(<ChangeEmailScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Nouvelle adresse e-mail'),
      'Nouvelle@Example.com',
    );
    await fireEvent.changeText(
      screen.getByLabelText('Mot de passe'),
      'Klotho2026!',
    );
    await press('Mettre à jour');

    expect(await screen.findByText('Vérifie ta boîte mail')).toBeOnTheScreen();
    expect(authApi.changeEmail).toHaveBeenCalledWith({
      newEmail: 'nouvelle@example.com',
      password: 'Klotho2026!',
    });
  });
});

describe('ConfirmEmailScreen', () => {
  it('confirms the new address from the link', async () => {
    mockParams = { token: 'abc' };
    jest
      .mocked(authApi.confirmEmail)
      .mockResolvedValue({ email: 'nouvelle@example.com' });
    jest.mocked(authApi.me).mockResolvedValue(session.user);
    await renderWithProviders(<ConfirmEmailScreen />);

    expect(
      await screen.findByText('Adresse e-mail confirmée'),
    ).toBeOnTheScreen();
    expect(authApi.confirmEmail).toHaveBeenCalledWith('abc');
  });

  it('says when the link is invalid', async () => {
    await renderWithProviders(<ConfirmEmailScreen />);

    expect(screen.getByText('Lien invalide')).toBeOnTheScreen();
    expect(authApi.confirmEmail).not.toHaveBeenCalled();
  });
});

describe('HelpScreen and TermsScreen', () => {
  it('unfolds an answer', async () => {
    await renderWithProviders(<HelpScreen />);

    await press('Comment ajouter une pièce à ma garde-robe ?');

    expect(screen.getByText(/touche le bouton « \+ »/)).toBeOnTheScreen();
  });

  it('shows the terms', async () => {
    await renderWithProviders(<TermsScreen />);

    expect(screen.getByText('1. Objet')).toBeOnTheScreen();
    expect(screen.getByText('8. Droit applicable')).toBeOnTheScreen();
  });
});
