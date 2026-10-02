import type { WeatherSettings } from '@klotho/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';

import { renderWithProviders } from '@/testing/render';

import { weatherApi } from '../api/weather.api';
import { WeatherSettingsScreen } from './WeatherSettingsScreen';

jest.mock('../api/weather.api');
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: () => true },
}));
const api = jest.mocked(weatherApi);
const location = jest.mocked(Location);

const LYON = {
  name: 'Lyon',
  country: 'FR',
  region: 'Auvergne-Rhône-Alpes',
  latitude: 45.76,
  longitude: 4.84,
};
const NOT_SET_UP: WeatherSettings = {
  locationMode: null,
  city: null,
  temperatureUnit: 'celsius',
};
const answer = (granted: boolean, canAskAgain = true) =>
  location.requestForegroundPermissionsAsync.mockResolvedValue({
    granted,
    canAskAgain,
  } as Location.LocationPermissionResponse);

const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));
const choose = (name: string) =>
  fireEvent.press(screen.getByRole('radio', { name }));

/** Waits for the save to settle (buttons leave their loading state). */
const waitForIdle = () =>
  waitFor(() =>
    expect(
      screen
        .queryAllByRole('button')
        .some((button) => button.props.accessibilityState?.busy),
    ).toBe(false),
  );

beforeEach(() => {
  jest.clearAllMocks();
  api.settings.mockResolvedValue(NOT_SET_UP);
  api.saveSettings.mockImplementation((settings) =>
    Promise.resolve({ ...NOT_SET_UP, ...settings } as WeatherSettings),
  );
  api.cities.mockResolvedValue([LYON]);
});

describe('WeatherSettingsScreen', () => {
  it('asks the permission only when the position is chosen', async () => {
    answer(true);
    await renderWithProviders(<WeatherSettingsScreen />);
    await screen.findByText('Localisation');
    expect(location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();

    await choose('Utiliser ma position');

    expect(
      await screen.findByText('Ta position sera utilisée pour la météo.'),
    ).toBeOnTheScreen();
    await press('Enregistrer');
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    await waitForIdle();
    expect(api.saveSettings).toHaveBeenCalledWith({
      locationMode: 'device',
      city: null,
      temperatureUnit: 'celsius',
    });
  });

  it('opens the city search when the permission is refused', async () => {
    answer(false);
    await renderWithProviders(<WeatherSettingsScreen />);
    await screen.findByText('Localisation');

    await choose('Utiliser ma position');

    expect(
      await screen.findByText('Pas de souci : choisis plutôt une ville.'),
    ).toBeOnTheScreen();
    // Nothing valid to save until a city is picked.
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();

    await fireEvent.changeText(
      screen.getByLabelText('Rechercher une ville'),
      'Lyo',
    );
    await fireEvent.press(
      await screen.findByRole('button', {
        name: 'Lyon, Auvergne-Rhône-Alpes, FR',
      }),
    );
    expect(
      screen.getByText('Ville choisie : Lyon, Auvergne-Rhône-Alpes, FR'),
    ).toBeOnTheScreen();
    expect(api.cities).toHaveBeenCalledWith('Lyo', 'fr');

    await choose('Fahrenheit (°F)');
    await press('Enregistrer');
    await waitFor(() => expect(router.back).toHaveBeenCalled());
    await waitForIdle();
    expect(api.saveSettings).toHaveBeenCalledWith({
      locationMode: 'city',
      city: LYON,
      temperatureUnit: 'fahrenheit',
    });
  });

  it('points to the phone settings when the permission is blocked', async () => {
    answer(false, false);
    await renderWithProviders(<WeatherSettingsScreen />);
    await screen.findByText('Localisation');

    await choose('Utiliser ma position');

    expect(
      await screen.findByText('Autorisation de localisation'),
    ).toBeOnTheScreen();
    await press('Saisir ma ville manuellement');

    expect(
      screen.queryByText('Autorisation de localisation'),
    ).not.toBeOnTheScreen();
    // The city search, and still the way to the settings.
    expect(
      screen.getByRole('button', { name: 'Ouvrir les réglages' }),
    ).toBeOnTheScreen();
  });

  it('starts from the saved settings', async () => {
    api.settings.mockResolvedValue({
      locationMode: 'city',
      city: LYON,
      temperatureUnit: 'fahrenheit',
    });
    await renderWithProviders(<WeatherSettingsScreen />);

    expect(
      await screen.findByText('Ville choisie : Lyon, Auvergne-Rhône-Alpes, FR'),
    ).toBeOnTheScreen();
    expect(
      screen.getByRole('radio', { name: 'Fahrenheit (°F)' }).props
        .accessibilityState,
    ).toMatchObject({ selected: true });
  });
});
