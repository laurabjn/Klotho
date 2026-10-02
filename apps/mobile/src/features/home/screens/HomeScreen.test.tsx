import type { Outfit, StyleProfile, WardrobeItem } from '@klotho/shared';
import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { signIn } from '@/features/auth/store/auth.store';
import { plansApi } from '@/features/calendar/api/plans.api';
import { outfitsApi } from '@/features/outfits/api/outfits.api';
import { preferencesApi } from '@/features/preferences/api/preferences.api';
import { EMPTY_STYLE_PROFILE } from '@/features/preferences/hooks/useStyleProfile';
import { wardrobeApi } from '@/features/wardrobe/api/wardrobe.api';
import { weatherApi } from '@/features/weather/api/weather.api';
import { renderWithProviders, session } from '@/testing/render';

import { useDailyStyleStore } from '../store/daily-style.store';
import { HomeScreen } from './HomeScreen';

jest.mock('@/features/auth/api/auth.api');
jest.mock('@/features/outfits/api/outfits.api');
jest.mock('@/features/calendar/api/plans.api');
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
    jest.mocked(outfitsApi.recent).mockResolvedValue([]);
    jest.mocked(plansApi.list).mockResolvedValue([]);
  });

  it('greets the user and shows the weather', async () => {
    await renderWithProviders(<HomeScreen />);

    expect(
      screen.getByRole('header', { name: 'Bonjour Laura' }),
    ).toBeOnTheScreen();
    expect(await screen.findByText('À configurer')).toBeOnTheScreen();
  });

  it('opens the outfit generator', async () => {
    await renderWithProviders(<HomeScreen />);

    // The main button (the outfit card offers the same without a look yet).
    const [generate] = screen.getAllByRole('button', {
      name: 'Générer ma tenue',
    });
    await fireEvent.press(generate!);

    expect(router.navigate).toHaveBeenCalledWith('/inspirations');
  });

  it("shows today's outfit once one was generated", async () => {
    jest.mocked(outfitsApi.recent).mockResolvedValue([
      {
        id: 'outfit-1',
        style: 'romantic',
        occasion: 'work',
        temperature: 17,
        condition: 'cloudy',
        pieces: [{ role: 'top', item: PIECE }],
        highlights: ['weather'],
        variantOf: null,
        createdAt: new Date().toISOString(),
        isFavorite: false,
        feedback: null,
        lastWornOn: null,
      },
    ]);
    await renderWithProviders(<HomeScreen />);

    expect(
      await screen.findByText('Romantique · Assurance au bureau'),
    ).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Voir la tenue' }),
    );

    expect(router.push).toHaveBeenCalledWith('/outfits/outfit-1');
  });

  it('picks the style of the day, favourite styles first', async () => {
    await renderWithProviders(<HomeScreen />);
    const boho = await screen.findByRole('radio', { name: 'Bohème' });

    await fireEvent.press(boho);

    expect(useDailyStyleStore.getState().style).toBe('boho');
  });

  it('shows a look in the style of the day, generating one if needed', async () => {
    const look = (id: string, style: Outfit['style']): Outfit => ({
      id,
      style,
      occasion: 'everyday',
      temperature: 17,
      condition: 'cloudy',
      pieces: [{ role: 'top', item: PIECE }],
      highlights: ['weather'],
      variantOf: null,
      createdAt: new Date().toISOString(),
      isFavorite: false,
      feedback: null,
      lastWornOn: null,
    });
    jest.mocked(outfitsApi.recent).mockResolvedValue([look('o1', 'boho')]);
    jest
      .mocked(outfitsApi.generate)
      .mockResolvedValue([look('o2', 'romantic')]);
    await renderWithProviders(<HomeScreen />);
    expect(
      await screen.findByText('Bohème · Élégance du quotidien'),
    ).toBeOnTheScreen();

    // Picking another style prepares a look in that style right away.
    jest
      .mocked(outfitsApi.recent)
      .mockResolvedValue([look('o2', 'romantic'), look('o1', 'boho')]);
    await fireEvent.press(screen.getByRole('radio', { name: 'Romantique' }));

    expect(outfitsApi.generate).toHaveBeenCalledWith(
      expect.objectContaining({ style: 'romantic', occasion: 'everyday' }),
    );
    expect(
      await screen.findByText('Romantique · Élégance du quotidien'),
    ).toBeOnTheScreen();

    // Back to a style already prepared today: no new generation.
    await fireEvent.press(screen.getByRole('radio', { name: 'Bohème' }));
    expect(outfitsApi.generate).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByText('Bohème · Élégance du quotidien'),
    ).toBeOnTheScreen();
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
