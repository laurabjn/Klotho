// Native modules replaced for Jest.

jest.mock(
  'react-native-safe-area-context',
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('react-native-safe-area-context/jest/mock').default,
);

// In-memory keychain. Plain functions (not jest.fn) so that
// jest.resetAllMocks() in a test file cannot wipe their behaviour.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: (key: string) => Promise.resolve(store.get(key) ?? null),
    setItemAsync: (key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    },
    deleteItemAsync: (key: string) => {
      store.delete(key);
      return Promise.resolve();
    },
    __store: store,
  };
});

// Location: no permission by default; tests override with jest.mocked(...).
jest.mock('expo-location', () => ({
  Accuracy: { Low: 2 },
  getForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: false, canAskAgain: true }),
  ),
  requestForegroundPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: false, canAskAgain: true }),
  ),
  getLastKnownPositionAsync: jest.fn(() => Promise.resolve(null)),
  getCurrentPositionAsync: jest.fn(),
}));

// Crash reporting: nothing leaves the tests.
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  wrap: <T>(component: T) => component,
}));

// Phone notifications: scheduled nowhere in the tests.
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  getPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: false, canAskAgain: true }),
  ),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  SchedulableTriggerInputTypes: { DAILY: 'daily', WEEKLY: 'weekly' },
}));
