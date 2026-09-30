import type { CurrentWeather, WeatherSettings } from '@klotho/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import * as Location from 'expo-location';

import { ApiError } from '@/lib/api/errors';
import { renderWithProviders } from '@/testing/render';

import { weatherApi } from '../api/weather.api';
import { useManualTemperatureStore } from '../store/manual-temperature.store';
import { WeatherTile } from './WeatherTile';

jest.mock('../api/weather.api');
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
const api = jest.mocked(weatherApi);
const location = jest.mocked(Location);

const LYON = {
  name: 'Lyon',
  country: 'FR',
  region: null,
  latitude: 45.76,
  longitude: 4.84,
};
const settings = (overrides: Partial<WeatherSettings> = {}) =>
  api.settings.mockResolvedValue({
    locationMode: null,
    city: null,
    temperatureUnit: 'celsius',
    ...overrides,
  });
const RAINY: CurrentWeather = {
  temperature: 12.4,
  feelsLike: 10.6,
  condition: 'rain',
  precipitation: 0.8,
  windSpeed: 18.2,
  locationName: 'Lyon',
  observedAt: '2026-10-01T08:00:00.000Z',
  source: 'device',
};
const grantPosition = () => {
  location.getForegroundPermissionsAsync.mockResolvedValue({
    granted: true,
    canAskAgain: true,
  } as Location.LocationPermissionResponse);
  location.getLastKnownPositionAsync.mockResolvedValue({
    coords: { latitude: 45.764043, longitude: 4.835659 },
  } as Location.LocationObject);
};
const openDetails = () =>
  fireEvent.press(
    screen.getByRole('button', { name: /^Voir la météo du jour/ }),
  );
const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));

beforeEach(() => {
  jest.clearAllMocks();
  useManualTemperatureStore.getState().clear();
  location.getForegroundPermissionsAsync.mockResolvedValue({
    granted: false,
    canAskAgain: true,
  } as Location.LocationPermissionResponse);
});

describe('WeatherTile', () => {
  it('invites to set up the weather', async () => {
    settings();
    await renderWithProviders(<WeatherTile />);

    expect(await screen.findByText('À configurer')).toBeOnTheScreen();
    await openDetails();
    expect(screen.getByText('Active la météo')).toBeOnTheScreen();
    await press('Configurer');

    expect(router.push).toHaveBeenCalledWith('/weather-settings');
    expect(api.current).not.toHaveBeenCalled();
  });

  it('shows the weather at the rounded phone position, details on press', async () => {
    settings({ locationMode: 'device' });
    grantPosition();
    api.current.mockResolvedValue(RAINY);
    await renderWithProviders(<WeatherTile />);

    expect(await screen.findByText('12°C')).toBeOnTheScreen();
    expect(screen.getByText('Pluie')).toBeOnTheScreen();
    expect(screen.getByText('Lyon')).toBeOnTheScreen();
    expect(api.current).toHaveBeenCalledWith({
      latitude: 45.76,
      longitude: 4.84,
    });

    await openDetails();
    expect(screen.getByText('Ressenti 11°')).toBeOnTheScreen();
    expect(screen.getByText('0.8 mm de pluie')).toBeOnTheScreen();
    expect(screen.getByText('Vent 18 km/h')).toBeOnTheScreen();
  });

  it('uses the saved city when the position is not available', async () => {
    settings({ locationMode: 'device', city: LYON });
    api.current.mockResolvedValue({ ...RAINY, source: 'city' });
    await renderWithProviders(<WeatherTile />);

    expect(await screen.findByText('12°C')).toBeOnTheScreen();
    expect(api.current).toHaveBeenCalledWith(undefined);
  });

  it('explains when neither the position nor a city is available', async () => {
    settings({ locationMode: 'device' });
    await renderWithProviders(<WeatherTile />);

    expect(await screen.findByText('Indisponible')).toBeOnTheScreen();
    await openDetails();
    expect(
      screen.getByText(/Ta position n’est pas disponible/),
    ).toBeOnTheScreen();
  });

  it('displays °F when chosen', async () => {
    settings({
      locationMode: 'city',
      city: LYON,
      temperatureUnit: 'fahrenheit',
    });
    api.current.mockResolvedValue(RAINY);
    await renderWithProviders(<WeatherTile />);

    expect(await screen.findByText('54°F')).toBeOnTheScreen();
  });

  it('offers to retry when the weather is unavailable', async () => {
    settings({ locationMode: 'city', city: LYON });
    api.current.mockRejectedValueOnce(new ApiError(503, 'weather.unavailable'));
    api.current.mockResolvedValueOnce(RAINY);
    await renderWithProviders(<WeatherTile />);

    expect(await screen.findByText('Indisponible')).toBeOnTheScreen();
    await openDetails();
    expect(
      screen.getByText(/La météo est indisponible pour le moment/),
    ).toBeOnTheScreen();
    await press('Réessayer');

    expect((await screen.findAllByText('12°C')).length).toBeGreaterThan(0);
  });

  it('lets the user enter today’s temperature, then go back to the weather', async () => {
    settings({ locationMode: 'city', city: LYON });
    api.current.mockResolvedValue(RAINY);
    await renderWithProviders(<WeatherTile />);
    await screen.findByText('12°C');

    await openDetails();
    await press('Saisir la température');
    await press('Monter d’un degré');
    await press('Monter d’un degré');
    await press('Valider');

    expect(screen.getByText('14°C')).toBeOnTheScreen();
    expect(screen.getByText('Saisie')).toBeOnTheScreen();
    expect(useManualTemperatureStore.getState().celsius).toBe(14);

    await openDetails();
    await press('Revenir à la météo');
    await waitFor(() =>
      expect(screen.getAllByText('12°C')).not.toHaveLength(0),
    );
    expect(useManualTemperatureStore.getState().celsius).toBeNull();
  });
});
