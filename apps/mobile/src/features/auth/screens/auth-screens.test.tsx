import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { ApiError, NetworkError } from '@/lib/api/errors';
import { renderWithProviders, session } from '@/testing/render';

import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { LoginScreen } from './LoginScreen';
import { RegisterScreen } from './RegisterScreen';
import { ResetPasswordScreen } from './ResetPasswordScreen';

jest.mock('../api/auth.api');
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => false,
  },
  useLocalSearchParams: jest.fn(() => ({})),
  Link: ({ children }: { children: unknown }) => children,
}));
const api = jest.mocked(authApi);

const type = (label: string, value: string) =>
  fireEvent.changeText(screen.getByLabelText(label), value);
const press = (label: string) =>
  fireEvent.press(screen.getByRole('button', { name: label }));

beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({ status: 'signedOut', user: null, accessToken: null });
});

describe('LoginScreen', () => {
  it('validates the form before calling the API', async () => {
    await renderWithProviders(<LoginScreen />);

    await press('Se connecter');

    expect(await screen.findByText('Adresse email invalide')).toBeOnTheScreen();
    expect(screen.getByText('Saisis ton mot de passe')).toBeOnTheScreen();
    expect(api.login).not.toHaveBeenCalled();
  });

  it('signs in with valid credentials', async () => {
    api.login.mockResolvedValue(session);
    await renderWithProviders(<LoginScreen />);

    await type('Email', ' Laura@Example.com ');
    await type('Mot de passe', 'Dressing2026!');
    await press('Se connecter');

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('signedIn'),
    );
    expect(api.login).toHaveBeenCalledWith({
      email: 'laura@example.com',
      password: 'Dressing2026!',
    });
  });

  it('shows a generic message for wrong credentials', async () => {
    api.login.mockRejectedValue(new ApiError(401, 'auth.invalidCredentials'));
    await renderWithProviders(<LoginScreen />);

    await type('Email', 'laura@example.com');
    await type('Mot de passe', 'nope');
    await press('Se connecter');

    expect(
      await screen.findByText('Email ou mot de passe incorrect.'),
    ).toBeOnTheScreen();
    expect(useAuthStore.getState().status).toBe('signedOut');
  });

  it('explains when the server is unreachable', async () => {
    api.login.mockRejectedValue(new NetworkError());
    await renderWithProviders(<LoginScreen />);

    await type('Email', 'laura@example.com');
    await type('Mot de passe', 'Dressing2026!');
    await press('Se connecter');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /Impossible de joindre le serveur/,
    );
  });

  it('lets the user reveal the password', async () => {
    await renderWithProviders(<LoginScreen />);

    const field = screen.getByLabelText('Mot de passe');
    expect(field).toHaveProp('secureTextEntry', true);
    await press('Afficher le mot de passe');
    expect(screen.getByLabelText('Mot de passe')).toHaveProp(
      'secureTextEntry',
      false,
    );
  });
});

describe('RegisterScreen', () => {
  async function fill(confirmPassword = 'Dressing2026!') {
    await renderWithProviders(<RegisterScreen />);
    await type('Prénom', 'Laura');
    await type('Email', 'laura@example.com');
    await type('Mot de passe', 'Dressing2026!');
    await type('Confirmer le mot de passe', confirmPassword);
  }

  it('ticks the password rules as the user types', async () => {
    await renderWithProviders(<RegisterScreen />);

    await type('Mot de passe', 'dressing');
    const rule = (key: string) =>
      screen.getByTestId(`password-rule-errors.password.${key}`).props
        .accessibilityState as { checked: boolean };
    expect(rule('lowercase').checked).toBe(true);
    expect(rule('tooShort').checked).toBe(true);
    expect(rule('uppercase').checked).toBe(false);
    expect(rule('special').checked).toBe(false);
  });

  it('refuses a confirmation that does not match', async () => {
    await fill('Dressing2026?');
    await press('Créer mon compte');

    expect(
      await screen.findByText('Les mots de passe ne correspondent pas'),
    ).toBeOnTheScreen();
    expect(api.register).not.toHaveBeenCalled();
  });

  it('creates the account without sending the confirmation', async () => {
    api.register.mockResolvedValue(session);
    await fill();
    await press('Créer mon compte');

    await waitFor(() =>
      expect(useAuthStore.getState().status).toBe('signedIn'),
    );
    expect(api.register).toHaveBeenCalledWith({
      firstName: 'Laura',
      email: 'laura@example.com',
      password: 'Dressing2026!',
    });
  });

  it('reports an email already in use', async () => {
    api.register.mockRejectedValue(new ApiError(409, 'auth.emailAlreadyUsed'));
    await fill();
    await press('Créer mon compte');

    expect(
      await screen.findByText('Un compte existe déjà avec cet email.'),
    ).toBeOnTheScreen();
  });
});

describe('ForgotPasswordScreen', () => {
  it('confirms without revealing whether the account exists', async () => {
    api.forgotPassword.mockResolvedValue(undefined);
    await renderWithProviders(<ForgotPasswordScreen />);

    await type('Email', 'laura@example.com');
    await press('Envoyer le lien');

    expect(await screen.findByText('Vérifie ta boîte mail')).toBeOnTheScreen();
    expect(
      screen.getByText(/Si un compte existe pour laura@example.com/),
    ).toBeOnTheScreen();
  });
});

describe('ResetPasswordScreen', () => {
  it('asks for a new link when the token is missing', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({});
    await renderWithProviders(<ResetPasswordScreen />);

    expect(screen.getByText(/Ce lien est incomplet/)).toBeOnTheScreen();
    await press('Demander un nouveau lien');
    expect(router.replace).toHaveBeenCalledWith('/forgot-password');
  });

  it('resets the password with the token from the link', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ token: 'abc' });
    api.resetPassword.mockResolvedValue(undefined);
    await renderWithProviders(<ResetPasswordScreen />);

    await type('Nouveau mot de passe', 'NewPassword1!');
    await type('Confirmer le mot de passe', 'NewPassword1!');
    await press('Mettre à jour mon mot de passe');

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/password-changed'),
    );
    expect(api.resetPassword).toHaveBeenCalledWith({
      token: 'abc',
      password: 'NewPassword1!',
    });
  });

  it('offers a new link when the token has expired', async () => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ token: 'old' });
    api.resetPassword.mockRejectedValue(
      new ApiError(400, 'auth.invalidResetToken'),
    );
    await renderWithProviders(<ResetPasswordScreen />);

    await type('Nouveau mot de passe', 'NewPassword1!');
    await type('Confirmer le mot de passe', 'NewPassword1!');
    await press('Mettre à jour mon mot de passe');

    expect(await screen.findByText(/Ce lien a expiré/)).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Demander un nouveau lien' }),
    ).toBeOnTheScreen();
  });
});
