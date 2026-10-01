import type { Outfit, StyleProfile, WardrobeItem } from '@klotho/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { preferencesApi } from '@/features/preferences/api/preferences.api';
import { EMPTY_STYLE_PROFILE } from '@/features/preferences/hooks/useStyleProfile';
import { wardrobeApi } from '@/features/wardrobe/api/wardrobe.api';
import { weatherApi } from '@/features/weather/api/weather.api';
import { ApiError } from '@/lib/api/errors';
import { renderWithProviders } from '@/testing/render';

import { outfitsApi } from '../api/outfits.api';
import { useGenerationDraftStore } from '../store/generation-draft.store';
import { OutfitDetailsScreen } from './OutfitDetailsScreen';
import { OutfitGeneratorScreen } from './OutfitGeneratorScreen';
import { OutfitReplaceItemScreen } from './OutfitReplaceItemScreen';
import { OutfitResultsScreen } from './OutfitResultsScreen';
import { OutfitVariantScreen } from './OutfitVariantScreen';
import { PickMandatoryItemScreen } from './PickMandatoryItemScreen';

let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock('../api/outfits.api');
jest.mock('@/features/preferences/api/preferences.api');
jest.mock('@/features/wardrobe/api/wardrobe.api');
jest.mock('@/features/weather/api/weather.api');
const api = jest.mocked(outfitsApi);

const item = (id: string, name: string, category: WardrobeItem['category']) =>
  ({
    id,
    name,
    category,
    subcategory: null,
    primaryColor: 'ecru',
    secondaryColors: [],
    styles: [],
    status: 'AVAILABLE',
    photos: [],
  }) as unknown as WardrobeItem;

const BLOUSE = item('blouse', 'Blouse', 'TOP');
const SKIRT = item('skirt', 'Jupe', 'BOTTOM');
const FLATS = item('flats', 'Ballerines', 'SHOES');
const LOAFERS = item('loafers', 'Mocassins', 'SHOES');

const outfit = (id: string, overrides: Partial<Outfit> = {}): Outfit => ({
  id,
  style: 'romantic',
  occasion: 'work',
  temperature: 17,
  condition: 'cloudy',
  pieces: [
    { role: 'top', item: BLOUSE },
    { role: 'bottom', item: SKIRT },
    { role: 'shoes', item: FLATS },
  ],
  highlights: ['weather', 'style'],
  variantOf: null,
  createdAt: '2026-10-01T08:00:00.000Z',
  ...overrides,
});

const press = (name: string | RegExp) =>
  fireEvent.press(screen.getByRole('button', { name }));

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  useGenerationDraftStore.getState().setMandatoryItem(null);
  jest.mocked(preferencesApi.get).mockResolvedValue({
    ...EMPTY_STYLE_PROFILE,
    preferredStyles: ['boho'],
    onboardingCompleted: true,
  } as StyleProfile);
  jest.mocked(weatherApi.settings).mockResolvedValue({
    locationMode: 'city',
    city: {
      name: 'Lyon',
      country: 'FR',
      region: null,
      latitude: 45.76,
      longitude: 4.84,
    },
    temperatureUnit: 'celsius',
  });
  jest.mocked(weatherApi.current).mockResolvedValue({
    temperature: 12.4,
    feelsLike: 11,
    condition: 'rain',
    precipitation: 1,
    windSpeed: 10,
    locationName: 'Lyon',
    observedAt: '2026-10-01T08:00:00.000Z',
    source: 'city',
  });
  jest.mocked(wardrobeApi.list).mockResolvedValue({
    items: [BLOUSE, SKIRT, FLATS],
    total: 3,
    page: 1,
    pageSize: 24,
    hasMore: false,
  });
});

describe('OutfitGeneratorScreen', () => {
  it('starts from smart defaults and generates 5 looks', async () => {
    api.generate.mockResolvedValue([outfit('o1'), outfit('o2')]);
    await renderWithProviders(<OutfitGeneratorScreen />);
    // The day's weather: rainy, 12 °C.
    await waitFor(() =>
      expect(
        screen.getByTestId('weather-rain').props.accessibilityState,
      ).toMatchObject({ selected: true }),
    );
    expect(screen.getByText('12°C')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Travail' }));
    await fireEvent.press(
      screen.getByRole('checkbox', { name: 'Pas de talons' }),
    );
    await press('Générer 5 tenues');

    await waitFor(() => expect(router.push).toHaveBeenCalled());
    expect(api.generate).toHaveBeenCalledWith({
      style: 'boho',
      occasion: 'work',
      temperature: 12,
      condition: 'rain',
      mandatoryItemId: null,
      exclusions: { categories: [], subcategories: ['pumps'], colors: [] },
    });
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/outfits/results',
      params: { ids: 'o1,o2' },
    });
  });

  it('imposes the chosen piece', async () => {
    api.generate.mockResolvedValue([outfit('o1')]);
    await renderWithProviders(<OutfitGeneratorScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Jupe' }));
    await press('Générer 5 tenues');

    await waitFor(() =>
      expect(api.generate).toHaveBeenCalledWith(
        expect.objectContaining({ mandatoryItemId: 'skirt' }),
      ),
    );
  });

  it('explains when no look is possible', async () => {
    api.generate.mockRejectedValue(
      new ApiError(422, 'outfits.noOutfitPossible'),
    );
    await renderWithProviders(<OutfitGeneratorScreen />);

    await press('Générer 5 tenues');

    expect(
      await screen.findByText(/Pas assez de pièces adaptées/),
    ).toBeOnTheScreen();
  });
});

describe('OutfitResultsScreen', () => {
  it('shows the proposals, and gets other ideas without the ones seen', async () => {
    mockParams = { ids: 'o1,o2' };
    api.get.mockImplementation((id) => Promise.resolve(outfit(id)));
    api.generate.mockResolvedValue([outfit('o3')]);
    await renderWithProviders(<OutfitResultsScreen />);

    expect(await screen.findAllByText('Assurance au bureau')).toHaveLength(2);
    await press('Générer d’autres idées');

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/outfits/results',
        params: { ids: 'o3' },
      }),
    );
    expect(api.generate).toHaveBeenCalledWith(
      expect.objectContaining({ excludeOutfitIds: ['o1', 'o2'] }),
    );
  });
});

describe('OutfitDetailsScreen', () => {
  it('shows the look, why, and the actions', async () => {
    mockParams = { id: 'o1' };
    api.get.mockResolvedValue(outfit('o1'));
    await renderWithProviders(<OutfitDetailsScreen />);

    expect(await screen.findByText('Assurance au bureau')).toBeOnTheScreen();
    expect(screen.getByText('Adaptée à la météo du jour.')).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Blouse' })).toBeOnTheScreen();

    await press('Remplacer une pièce');
    expect(router.push).toHaveBeenCalledWith('/outfits/o1/replace');
    await press('Créer une variante');
    expect(router.push).toHaveBeenCalledWith('/outfits/o1/variant');
    await press('Marquer comme portée');
    expect(screen.getByText('Bientôt disponible')).toBeOnTheScreen();
  });
});

describe('OutfitReplaceItemScreen', () => {
  it('swaps the shoes for a compatible suggestion', async () => {
    mockParams = { id: 'o1' };
    api.get.mockResolvedValue(outfit('o1'));
    api.alternatives.mockResolvedValue([{ item: LOAFERS, compatible: true }]);
    api.replaceItem.mockResolvedValue(
      outfit('o1', {
        pieces: [
          { role: 'top', item: BLOUSE },
          { role: 'bottom', item: SKIRT },
          { role: 'shoes', item: LOAFERS },
        ],
      }),
    );
    await renderWithProviders(<OutfitReplaceItemScreen />);

    await fireEvent.press(
      await screen.findByRole('radio', { name: 'Mocassins, Compatible' }),
    );
    await press('Appliquer le remplacement');

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(api.alternatives).toHaveBeenCalledWith('o1', 'shoes');
    expect(api.replaceItem).toHaveBeenCalledWith('o1', 'shoes', 'loafers');
  });
});

describe('OutfitVariantScreen', () => {
  it('keeps the base of the look and proposes new ideas', async () => {
    mockParams = { id: 'o1' };
    api.get.mockResolvedValue(outfit('o1'));
    api.variant
      .mockResolvedValueOnce(outfit('v1', { variantOf: 'o1' }))
      .mockResolvedValueOnce(outfit('v2', { variantOf: 'o1' }));
    await renderWithProviders(<OutfitVariantScreen />);

    expect(await screen.findByText('Nouvelle variante')).toBeOnTheScreen();
    expect(api.variant).toHaveBeenCalledWith('o1', {
      lockedItemIds: ['skirt'],
      excludeOutfitIds: [],
    });

    await press('Générer une autre idée');
    await waitFor(() =>
      expect(api.variant).toHaveBeenLastCalledWith('o1', {
        lockedItemIds: ['skirt'],
        excludeOutfitIds: ['v1'],
      }),
    );
    await press('Enregistrer cette variante');
    expect(router.replace).toHaveBeenCalledWith('/outfits/v2');
  });
});

describe('PickMandatoryItemScreen', () => {
  it('picks the piece to impose', async () => {
    await renderWithProviders(<PickMandatoryItemScreen />);

    await fireEvent.press(await screen.findByRole('button', { name: 'Jupe' }));
    await press('Utiliser cette pièce');

    expect(useGenerationDraftStore.getState().mandatoryItem).toEqual(SKIRT);
    expect(router.back).toHaveBeenCalled();
  });
});
