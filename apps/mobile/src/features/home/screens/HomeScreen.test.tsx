import type { StyleProfile, WardrobeItem } from '@klotho/shared';
import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { signIn } from '@/features/auth/store/auth.store';
import { preferencesApi } from '@/features/preferences/api/preferences.api';
import { EMPTY_STYLE_PROFILE } from '@/features/preferences/hooks/useStyleProfile';
import { wardrobeApi } from '@/features/wardrobe/api/wardrobe.api';
import { weatherApi } from '@/features/weather/api/weather.api';
import { renderWithProviders, session } from '@/testing/render';

import { useDailyStyleStore } from '../store/daily-style.store';
import { HomeScreen } from './HomeScreen';

jest.mock('@/features/auth/api/auth.api');
jest.mock('@/features/preferences/api/preferences.api');
jest.mock('@/features/wardrobe/api/wardrobe.api');
jest.mock('@/features/weather/api/weather.api');
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
}));

const PIECE = {
  id: 'piece-1',
  name: 'Blazer beige',
  category: 'LAYER',
  primaryColor: 'sand',
  photos: [],
  lastWornAt: null,
} as unknown as WardrobeItem;

const page = (items: WardrobeItem[]) => ({
  items,
  total: items.length,
  page: 1,
  pageSize: 1,
  hasMore: false,
});

describe('HomeScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    useDailyStyleStore.getState().choose(null);
    await signIn(session);
    jest.mocked(weatherApi.settings).mockResolvedValue({
      locationMode: null,
      city: null,
      temperatureUnit: 'celsius',
    });
    jest.mocked(preferencesApi.get).mockResolvedValue({
      ...EMPTY_STYLE_PROFILE,
      preferredStyles: ['boho'],
      onboardingCompleted: true,
    } as StyleProfile);
    jest.mocked(wardrobeApi.list).mockResolvedValue(page([PIECE]));
  });

  it('greets the user and shows the weather', async () => {
    await renderWithProviders(<HomeScreen />);

    expect(
      screen.getByRole('header', { name: 'Bonjour Laura' }),
    ).toBeOnTheScreen();
    expect(await screen.findByText('À configurer')).toBeOnTheScreen();
  });

  it('says the outfit generation is coming soon', async () => {
    await renderWithProviders(<HomeScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Générer ma tenue' }),
    );

    expect(
      screen.getByText(/Klotho composera bientôt tes tenues/),
    ).toBeOnTheScreen();
  });

  it('picks the style of the day, favourite styles first', async () => {
    await renderWithProviders(<HomeScreen />);
    const boho = await screen.findByRole('radio', { name: 'Bohème' });

    await fireEvent.press(boho);

    expect(useDailyStyleStore.getState().style).toBe('boho');
  });

  it('suggests the least worn piece', async () => {
    await renderWithProviders(<HomeScreen />);

    expect(
      await screen.findByText(/« Blazer beige » n’a pas encore été portée/),
    ).toBeOnTheScreen();
    expect(wardrobeApi.list).toHaveBeenCalledWith({
      sort: 'leastWorn',
      status: ['AVAILABLE'],
      pageSize: 1,
    });
    await fireEvent.press(screen.getByText('Redécouvre cette pièce'));

    expect(router.push).toHaveBeenCalledWith('/piece/piece-1');
  });

  it('hides the suggestion when the wardrobe is empty', async () => {
    jest.mocked(wardrobeApi.list).mockResolvedValue(page([]));
    await renderWithProviders(<HomeScreen />);
    await screen.findByText('À configurer');

    expect(screen.queryByText('Redécouvre cette pièce')).not.toBeOnTheScreen();
  });
});
