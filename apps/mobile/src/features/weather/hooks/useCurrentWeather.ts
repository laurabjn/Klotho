import type { CurrentWeather, TemperatureUnit } from '@klotho/shared';
import { useQuery } from '@tanstack/react-query';

import { weatherApi } from '../api/weather.api';
import { getDevicePosition } from '../lib/device-position';
import {
  currentWeatherKey,
  devicePositionKey,
  useWeatherSettings,
} from './useWeatherSettings';

/** The weather of a place barely changes in 10 minutes (the API caches too). */
const FRESH_MS = 10 * 60_000;

export type CurrentWeatherState =
  | { status: 'loading' }
  /** No location mode chosen: manual temperature only. */
  | { status: 'unconfigured' }
  /** Position mode, but no permission or no position, and no backup city. */
  | { status: 'positionUnavailable' }
  | { status: 'error'; error: unknown }
  | { status: 'ready'; weather: CurrentWeather };

/**
 * Weather at the phone position (position mode) or at the saved city; the
 * city is also the backup when the position is unavailable.
 */
export function useCurrentWeather(): CurrentWeatherState & {
  unit: TemperatureUnit;
  retry: () => void;
} {
  const settings = useWeatherSettings();
  const mode = settings.data?.locationMode ?? null;
  const city = settings.data?.city ?? null;

  const position = useQuery({
    queryKey: devicePositionKey,
    queryFn: getDevicePosition,
    enabled: mode === 'device',
    staleTime: FRESH_MS,
  });
  const coords = mode === 'device' ? (position.data ?? null) : null;
  const useCity =
    city !== null &&
    (mode === 'city' || (mode === 'device' && position.isSuccess && !coords));

  const weather = useQuery({
    queryKey: [...currentWeatherKey, useCity ? city : coords],
    queryFn: () => weatherApi.current(useCity ? undefined : coords!),
    enabled: coords !== null || useCity,
    staleTime: FRESH_MS,
  });

  const unit = settings.data?.temperatureUnit ?? 'celsius';
  const retry = () => {
    if (settings.isError) void settings.refetch();
    if (mode === 'device') void position.refetch();
    if (weather.isError) void weather.refetch();
  };
  const state = ((): CurrentWeatherState => {
    if (settings.isError) return { status: 'error', error: settings.error };
    if (!settings.data) return { status: 'loading' };
    if (mode === null) return { status: 'unconfigured' };
    if (mode === 'device' && position.isPending) return { status: 'loading' };
    if (coords === null && !useCity) return { status: 'positionUnavailable' };
    if (weather.isError) return { status: 'error', error: weather.error };
    if (!weather.data) return { status: 'loading' };
    return { status: 'ready', weather: weather.data };
  })();

  return { ...state, unit, retry };
}
