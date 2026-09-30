import * as Location from 'expo-location';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/** About 1 km: enough for the weather, the exact position never leaves the phone. */
export function coarsen({ latitude, longitude }: Coordinates): Coordinates {
  const round = (value: number) => Math.round(value * 100) / 100;
  return { latitude: round(latitude), longitude: round(longitude) };
}

export type PermissionAnswer = 'granted' | 'denied' | 'blocked';

/** Shows the system prompt; only called when the user asks for it. */
export async function requestLocationPermission(): Promise<PermissionAnswer> {
  const answer = await Location.requestForegroundPermissionsAsync();
  if (answer.granted) return 'granted';
  // "blocked": the system will not show the prompt again, only the settings can.
  return answer.canAskAgain ? 'denied' : 'blocked';
}

const LAST_KNOWN_MAX_AGE_MS = 30 * 60_000;

/**
 * Rounded position of the phone, or null when the permission is not granted
 * or the location is off. Never asks for the permission.
 */
export async function getDevicePosition(): Promise<Coordinates | null> {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) return null;
  try {
    const position =
      (await Location.getLastKnownPositionAsync({
        maxAge: LAST_KNOWN_MAX_AGE_MS,
      })) ??
      // City-level accuracy: faster, and the GPS is not needed.
      (await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      }));
    return coarsen(position.coords);
  } catch {
    return null;
  }
}
