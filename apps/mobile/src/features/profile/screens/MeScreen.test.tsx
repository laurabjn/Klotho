import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import type {
  StyleProfile,
  WardrobeItem,
  WeatherSettings,
} from '@klotho/shared';

import { authApi } from '@/features/auth/api/auth.api';
import { billingApi } from '@/features/billing/api/billing.api';
import { billingStatus } from '@/features/billing/testing';
import { signIn, useAuthStore } from '@/features/auth/store/auth.store';
import { preferencesApi } from '@/features/preferences/api/preferences.api';
import { EMPTY_STYLE_PROFILE } from '@/features/preferences/hooks/useStyleProfile';
import { wardrobeApi } from '@/features/wardrobe/api/wardrobe.api';
import { notificationsApi } from '@/features/notifications/api/notifications.api';
import { weatherApi } from '@/features/weather/api/weather.api';
import { renderWithProviders, session } from '@/testing/render';

import { MeScreen } from './MeScreen';

jest.mock('@/features/auth/api/auth.api');
jest.mock('@/features/preferences/api/preferences.api');
jest.mock('@/features/wardrobe/api/wardrobe.api');
jest.mock('@/features/weather/api/weather.api');
jest.mock('@/features/notifications/api/notifications.api');
jest.mock('@/features/billing/api/billing.api');
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
}));
const api = jest.mocked(authApi);
const preferences = jest.mocked(preferencesApi);
const weather = jest.mocked(weatherApi);

const PROFILE: StyleProfile = {
  ...EMPTY_STYLE_PROFILE,
  preferredStyles: ['romantic'],
  preferredColors: ['powderPink'],
  preferredMetals: ['gold'],
  onboardingCompleted: true,
};
const SETTINGS = {
  locationMode: null,
  city: null,
  temperatureUnit: 'celsius' as const,
};
const piece = (styles: WardrobeItem['styles']) => ({ styles }) as WardrobeItem;

describe('MeScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await signIn(session);
    preferences.get.mockResolvedValue(PROFILE);
    preferences.save.mockImplementation((body) =>
      Promise.resolve({ ...PROFILE, ...body } as StyleProfile),
    );
    weather.settings.mockResolvedValue(SETTINGS);
    weather.saveSettings.mockImplementation((body) =>
      Promise.resolve({ ...SETTINGS, ...body } as WeatherSettings),
    );
    jest.mocked(wardrobeApi.list).mockResolvedValue({
      items: [piece(['chic']), piece(['boho', 'chic']), piece([])],
      total: 3,
      page: 1,
      pageSize: 100,
      hasMore: false,
    });
  });

  it('shows the pieces count, the main style and the preferences', async () => {
    await renderWithProviders(<MeScreen />);

    expect(await screen.findByLabelText('3 pièces')).toBeOnTheScreen();
    expect(screen.getByLabelText('Chic Style dominant')).toBeOnTheScreen();
    expect(await screen.findByText('Romantique')).toBeOnTheScreen();
    expect(screen.getByText('Rose poudré')).toBeOnTheScreen();
  });

  it('only summarises the styles: changes happen in "Tous les styles"', async () => {
    await renderWithProviders(<MeScreen />);
    await screen.findByText('Romantique');

    await fireEvent.press(
      screen.getByRole('button', { name: 'Mes styles préférés' }),
    );

    expect(router.push).toHaveBeenCalledWith('/styles');
    expect(preferences.save).not.toHaveBeenCalled();
    expect(screen.queryByText('Vintage')).not.toBeOnTheScreen();
  });

  it('opens the profile edition and the settings', async () => {
    await renderWithProviders(<MeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Modifier' }));
    expect(router.push).toHaveBeenCalledWith('/profile/edit');
    await fireEvent.press(screen.getByRole('button', { name: 'Paramètres' }));
    expect(router.push).toHaveBeenCalledWith('/settings');
  });

  it('turns the outfit reminders off', async () => {
    jest.mocked(notificationsApi.settings).mockResolvedValue({
      tips: true,
      reminders: true,
      news: false,
      reminderTime: '08:00',
    });
    jest.mocked(notificationsApi.saveSettings).mockImplementation((body) =>
      Promise.resolve({
        tips: true,
        news: false,
        reminderTime: '08:00',
        reminders: true,
        ...body,
      }),
    );
    await renderWithProviders(<MeScreen />);
    const reminders = await screen.findByRole('switch', {
      name: 'Rappels de tenues et suggestions',
    });
    await waitFor(() =>
      expect(reminders.props.accessibilityState).toMatchObject({
        checked: true,
      }),
    );

    await fireEvent.press(reminders);

    await waitFor(() =>
      expect(notificationsApi.saveSettings).toHaveBeenCalledWith(
        expect.objectContaining({ reminders: false }),
      ),
    );
  });

  it('adds a metal to the preferred ones', async () => {
    await renderWithProviders(<MeScreen />);
    await screen.findByText('Rose poudré');

    await fireEvent.press(screen.getByRole('checkbox', { name: 'Rosé' }));

    await waitFor(() =>
      expect(preferences.save).toHaveBeenCalledWith(
        expect.objectContaining({ preferredMetals: ['gold', 'roseGold'] }),
      ),
    );
  });

  it('switches the temperature unit', async () => {
    await renderWithProviders(<MeScreen />);
    await screen.findByText('Rose poudré');

    await fireEvent.press(
      screen.getByRole('radio', { name: 'Fahrenheit (°F)' }),
    );

    await waitFor(() =>
      expect(weather.saveSettings).toHaveBeenCalledWith({
        ...SETTINGS,
        temperatureUnit: 'fahrenheit',
      }),
    );
  });

  it('opens Klotho Premium, with the current plan', async () => {
    jest.mocked(billingApi.status).mockResolvedValue(billingStatus());
    await renderWithProviders(<MeScreen />);

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Klotho Premium · Gratuit' }),
    );

    expect(router.push).toHaveBeenCalledWith('/premium');
  });

  it('hides Premium while payments are off', async () => {
    jest
      .mocked(billingApi.status)
      .mockResolvedValue(billingStatus({ enabled: false }));
    await renderWithProviders(<MeScreen />);
    await screen.findByText('Rose poudré');

    expect(
      screen.queryByRole('button', { name: /Klotho Premium/ }),
    ).not.toBeOnTheScreen();
  });

  it('opens the preferences', async () => {
    await renderWithProviders(<MeScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Mes préférences' }),
    );

    expect(router.push).toHaveBeenCalledWith('/preferences');
  });

  it('opens the weather settings', async () => {
    await renderWithProviders(<MeScreen />);

    await fireEvent.press(screen.getByRole('button', { name: 'Météo' }));

    expect(router.push).toHaveBeenCalledWith('/weather-settings');
  });

  it('shows who is signed in', async () => {
    await renderWithProviders(<MeScreen />);

    expect(screen.getByText('Laura')).toBeOnTheScreen();
    expect(screen.getByText('laura@example.com')).toBeOnTheScreen();
  });

  it('asks for confirmation, then signs out', async () => {
    api.logout.mockResolvedValue(undefined);
    await renderWithProviders(<MeScreen />);

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
    await renderWithProviders(<MeScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Se déconnecter' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Annuler' }));

    expect(screen.queryByText('Se déconnecter ?')).not.toBeOnTheScreen();
    expect(useAuthStore.getState().status).toBe('signedIn');
  });
});
