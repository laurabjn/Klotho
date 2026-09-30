import * as Location from 'expo-location';

import {
  coarsen,
  getDevicePosition,
  requestLocationPermission,
} from './device-position';

const location = jest.mocked(Location);
const permission = (granted: boolean, canAskAgain = true) =>
  ({ granted, canAskAgain }) as Location.LocationPermissionResponse;
const at = (latitude: number, longitude: number) =>
  ({ coords: { latitude, longitude } }) as Location.LocationObject;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('coarsen', () => {
  it('keeps about 1 km of precision', () => {
    expect(coarsen({ latitude: 45.764043, longitude: 4.835659 })).toEqual({
      latitude: 45.76,
      longitude: 4.84,
    });
  });
});

describe('requestLocationPermission', () => {
  it.each([
    [permission(true), 'granted'],
    [permission(false, true), 'denied'],
    [permission(false, false), 'blocked'],
  ])('reads %j as "%s"', async (answer, expected) => {
    location.requestForegroundPermissionsAsync.mockResolvedValue(answer);

    await expect(requestLocationPermission()).resolves.toBe(expected);
  });
});

describe('getDevicePosition', () => {
  it('never asks for the permission itself', async () => {
    location.getForegroundPermissionsAsync.mockResolvedValue(permission(false));

    await expect(getDevicePosition()).resolves.toBeNull();
    expect(location.requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  });

  it('prefers the recent last known position, rounded', async () => {
    location.getForegroundPermissionsAsync.mockResolvedValue(permission(true));
    location.getLastKnownPositionAsync.mockResolvedValue(
      at(45.764043, 4.835659),
    );

    await expect(getDevicePosition()).resolves.toEqual({
      latitude: 45.76,
      longitude: 4.84,
    });
    expect(location.getCurrentPositionAsync).not.toHaveBeenCalled();
  });

  it('otherwise asks for a city-level position', async () => {
    location.getForegroundPermissionsAsync.mockResolvedValue(permission(true));
    location.getLastKnownPositionAsync.mockResolvedValue(null);
    location.getCurrentPositionAsync.mockResolvedValue(at(48.8566, 2.3522));

    await expect(getDevicePosition()).resolves.toEqual({
      latitude: 48.86,
      longitude: 2.35,
    });
    expect(location.getCurrentPositionAsync).toHaveBeenCalledWith({
      accuracy: Location.Accuracy.Low,
    });
  });

  it('gives null when the location is turned off', async () => {
    location.getForegroundPermissionsAsync.mockResolvedValue(permission(true));
    location.getLastKnownPositionAsync.mockRejectedValue(
      new Error('Location services are disabled'),
    );

    await expect(getDevicePosition()).resolves.toBeNull();
  });
});
