import type { StyleProfile } from '@klotho/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { renderWithProviders } from '@/testing/render';

import { preferencesApi } from '../api/preferences.api';
import { EMPTY_STYLE_PROFILE } from '../hooks/useStyleProfile';
import { AllStylesScreen } from './AllStylesScreen';
import { PaletteScreen } from './PaletteScreen';

jest.mock('../api/preferences.api');
jest.mock('expo-router', () => ({
  router: { back: jest.fn(), push: jest.fn(), canGoBack: () => true },
}));
const api = jest.mocked(preferencesApi);

const saved = (overrides: Partial<StyleProfile> = {}) =>
  ({
    ...EMPTY_STYLE_PROFILE,
    onboardingCompleted: true,
    ...overrides,
  }) as StyleProfile;

beforeEach(() => {
  jest.clearAllMocks();
  api.save.mockImplementation((profile) =>
    Promise.resolve(saved(profile as Partial<StyleProfile>)),
  );
});

describe('PaletteScreen', () => {
  it('picks the favourite colours', async () => {
    api.get.mockResolvedValue(
      saved({ preferredColors: ['powderPink'], avoidedColors: ['taupe'] }),
    );
    await renderWithProviders(<PaletteScreen />);

    await fireEvent.press(
      await screen.findByRole('checkbox', { name: 'Taupe' }),
    );
    await fireEvent.press(
      screen.getByRole('button', { name: 'Valider mes couleurs' }),
    );

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(api.save).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredColors: ['powderPink', 'taupe'],
        avoidedColors: [],
      }),
    );
  });

  it('finds a colour without its accents', async () => {
    api.get.mockResolvedValue(saved());
    await renderWithProviders(<PaletteScreen />);

    await fireEvent.changeText(
      await screen.findByLabelText('Rechercher une couleur…'),
      'ecru',
    );

    expect(screen.getByRole('checkbox', { name: 'Écru' })).toBeOnTheScreen();
    expect(
      screen.queryByRole('checkbox', { name: 'Taupe' }),
    ).not.toBeOnTheScreen();
  });
});

describe('AllStylesScreen', () => {
  it('saves the chosen styles', async () => {
    api.get.mockResolvedValue(saved({ preferredStyles: ['romantic'] }));
    await renderWithProviders(<AllStylesScreen />);

    await fireEvent.changeText(
      await screen.findByLabelText('Rechercher un style…'),
      'boheme',
    );
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Bohème' }));
    await fireEvent.press(
      screen.getByRole('button', { name: 'Valider ma sélection' }),
    );

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(api.save).toHaveBeenCalledWith(
      expect.objectContaining({ preferredStyles: ['romantic', 'boho'] }),
    );
  });
});
