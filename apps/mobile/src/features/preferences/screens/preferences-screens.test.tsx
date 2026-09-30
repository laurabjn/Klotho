import type { StyleProfile } from '@klotho/shared';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import { renderWithProviders } from '@/testing/render';

import { preferencesApi } from '../api/preferences.api';
import { EMPTY_STYLE_PROFILE } from '../hooks/useStyleProfile';
import { OnboardingScreen } from './OnboardingScreen';
import { PreferencesScreen } from './PreferencesScreen';

jest.mock('../api/preferences.api');
jest.mock('expo-router', () => ({
  router: { replace: jest.fn(), back: jest.fn(), canGoBack: () => true },
}));
const api = jest.mocked(preferencesApi);

const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));
const saved = (overrides: Partial<StyleProfile> = {}): StyleProfile => ({
  ...EMPTY_STYLE_PROFILE,
  onboardingCompleted: true,
  ...overrides,
});

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
});

describe('OnboardingScreen', () => {
  it('can be skipped from the welcome screen', async () => {
    api.save.mockResolvedValue(saved());
    await renderWithProviders(<OnboardingScreen />);

    expect(screen.getByText('Bienvenue dans Klotho')).toBeOnTheScreen();
    await press('Passer pour l’instant');

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    await waitForIdle();
    expect(api.save).toHaveBeenCalledWith(EMPTY_STYLE_PROFILE);
  });

  it('saves the choices of the four steps', async () => {
    api.save.mockResolvedValue(saved());
    await renderWithProviders(<OnboardingScreen />);

    await press('Commencer');
    expect(screen.getByText('Étape 2/4')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Romantique' }));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Vintage' }));
    await press('Continuer');

    expect(screen.getByText('Étape 3/4')).toBeOnTheScreen();
    const [favoritePink] = screen.getAllByRole('checkbox', {
      name: 'Rose poudré',
    });
    await fireEvent.press(favoritePink!);
    const blacks = screen.getAllByRole('checkbox', { name: 'Noir' });
    await fireEvent.press(blacks[1]!); // second picker: colours to avoid
    await press('Continuer');

    expect(screen.getByText('Étape 4/4')).toBeOnTheScreen();
    await fireEvent.press(screen.getByTestId('metal-gold'));
    await fireEvent.press(screen.getByTestId('metal-roseGold'));
    await fireEvent.press(screen.getByTestId('heels-no'));
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Des jupes' }));
    await press('Terminer');

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith('/'));
    await waitForIdle();
    expect(api.save).toHaveBeenCalledWith({
      ...EMPTY_STYLE_PROFILE,
      preferredStyles: ['romantic', 'vintage'],
      preferredColors: ['powderPink'],
      avoidedColors: ['black'],
      preferredMetals: ['gold', 'roseGold'],
      acceptsHeels: false,
      preferredBottoms: ['skirts'],
    });
  });

  it('never keeps a colour both favourite and avoided', async () => {
    api.save.mockResolvedValue(saved());
    await renderWithProviders(<OnboardingScreen />);
    await press('Commencer');
    await press('Continuer');

    const [favoriteBlack, avoidedBlack] = screen.getAllByRole('checkbox', {
      name: 'Noir',
    });
    await fireEvent.press(avoidedBlack!);
    await fireEvent.press(favoriteBlack!);
    await press('Continuer');
    await press('Terminer');

    await waitFor(() => expect(api.save).toHaveBeenCalled());
    await waitForIdle();
    expect(api.save).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredColors: ['black'],
        avoidedColors: [],
      }),
    );
  });
});

describe('PreferencesScreen', () => {
  it('starts from the saved profile and saves the changes', async () => {
    api.get.mockResolvedValue(
      saved({ preferredStyles: ['chic'], preferredMetals: ['gold'] }),
    );
    api.save.mockImplementation((profile) =>
      Promise.resolve(saved(profile as Partial<StyleProfile>)),
    );
    await renderWithProviders(<PreferencesScreen />);

    const chic = await screen.findByRole('checkbox', { name: 'Chic' });
    expect(chic.props.accessibilityState).toMatchObject({ checked: true });

    await fireEvent.press(screen.getByTestId('metal-silver'));
    await fireEvent.press(screen.getByRole('radio', { name: 'Printemps' }));
    await press('Enregistrer');

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    await waitForIdle();
    expect(api.save).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredStyles: ['chic'],
        preferredMetals: ['gold', 'silver'],
        colorSeason: 'spring',
      }),
    );
  });

  it('shows the advanced preferences (face colours, colour season)', async () => {
    api.get.mockResolvedValue(saved());
    await renderWithProviders(<PreferencesScreen />);

    expect(
      await screen.findByText('Couleurs près du visage'),
    ).toBeOnTheScreen();
    expect(screen.getByText('Ma colorimétrie')).toBeOnTheScreen();
  });
});
