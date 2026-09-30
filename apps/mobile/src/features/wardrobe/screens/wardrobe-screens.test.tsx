import {
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { NetworkError } from '@/lib/api/errors';
import { renderWithProviders } from '@/testing/render';

import { wardrobeApi } from '../api/wardrobe.api';
import { page, wardrobeItem } from '../testing';
import { AddWardrobeItemScreen } from './AddWardrobeItemScreen';
import { EditWardrobeItemScreen } from './EditWardrobeItemScreen';
import { WardrobeItemDetailsScreen } from './WardrobeItemDetailsScreen';
import { WardrobeScreen } from './WardrobeScreen';

jest.mock('../api/wardrobe.api');
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: () => true,
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));
const api = jest.mocked(wardrobeApi);

const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('WardrobeScreen', () => {
  it('lists the pieces with their count', async () => {
    api.list.mockResolvedValue(
      page([
        wardrobeItem({ name: 'Blouse fleurie', styles: ['romantic'] }),
        wardrobeItem({
          name: 'Jean droit',
          category: 'BOTTOM',
          primaryColor: 'denim',
        }),
      ]),
    );
    await renderWithProviders(<WardrobeScreen />);

    expect(await screen.findByText('Blouse fleurie')).toBeOnTheScreen();
    expect(screen.getByText('Jean droit')).toBeOnTheScreen();
    expect(screen.getByText('2 pièces')).toBeOnTheScreen();
    expect(screen.getByText('Romantique')).toBeOnTheScreen();
  });

  it('names an unnamed piece after its sub-category', async () => {
    api.list.mockResolvedValue(
      page([wardrobeItem({ subcategory: 'cardigan' })]),
    );
    await renderWithProviders(<WardrobeScreen />);

    expect(await screen.findByText('Cardigan')).toBeOnTheScreen();
  });

  it('shows the empty state for a new wardrobe', async () => {
    api.list.mockResolvedValue(page([]));
    await renderWithProviders(<WardrobeScreen />);

    expect(
      await screen.findByText('Ton dressing est encore vide'),
    ).toBeOnTheScreen();
    await press('Ajouter ma première pièce');
    expect(router.push).toHaveBeenCalledWith('/piece/new');
  });

  it('filters by category', async () => {
    api.list.mockResolvedValue(page([wardrobeItem({ name: 'Blouse' })]));
    await renderWithProviders(<WardrobeScreen />);
    await screen.findByText('Blouse');

    await fireEvent.press(screen.getByRole('radio', { name: 'Robes' }));

    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: ['DRESS'] }),
      ),
    );
    // Let the refetched list render before the test ends.
    expect(await screen.findByText('Blouse')).toBeOnTheScreen();
  });

  it('applies the filters of the sheet only on "Appliquer"', async () => {
    api.list.mockResolvedValue(page([wardrobeItem({ name: 'Blouse' })]));
    await renderWithProviders(<WardrobeScreen />);
    await screen.findByText('Blouse');

    await press('Filtres');
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Au lavage' }));
    expect(api.list).toHaveBeenCalledTimes(1);

    await press('Appliquer');

    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: ['WASHING'] }),
      ),
    );
    expect(await screen.findByText('Blouse')).toBeOnTheScreen();
  });

  it('proposes to clear the filters when nothing matches', async () => {
    api.list
      .mockResolvedValueOnce(page([wardrobeItem({ name: 'Blouse' })]))
      .mockResolvedValue(page([]));
    await renderWithProviders(<WardrobeScreen />);
    await screen.findByText('Blouse');

    await fireEvent.press(screen.getByRole('radio', { name: 'Sacs' }));

    expect(await screen.findByText('Aucune pièce trouvée')).toBeOnTheScreen();
  });

  it('offers to retry when the list cannot be loaded', async () => {
    api.list
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValue(page([]));
    await renderWithProviders(<WardrobeScreen />);

    expect(
      await screen.findByText('Impossible de charger ta garde-robe.'),
    ).toBeOnTheScreen();
    await press('Réessayer');
    expect(
      await screen.findByText('Ton dressing est encore vide'),
    ).toBeOnTheScreen();
  });
});

describe('AddWardrobeItemScreen', () => {
  it('requires a category before the next step', async () => {
    await renderWithProviders(<AddWardrobeItemScreen />);

    await press('Continuer');

    expect(await screen.findByText('Choisis une catégorie')).toBeOnTheScreen();
    expect(screen.getByText('Étape 1/4')).toBeOnTheScreen();
  });

  it('creates a piece through the four steps', async () => {
    api.create.mockResolvedValue(wardrobeItem({ id: 'new-item' }));
    await renderWithProviders(<AddWardrobeItemScreen />);

    // 1. Infos
    await fireEvent.press(screen.getByRole('radio', { name: 'Haut' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Blouse' }));
    await fireEvent.changeText(
      screen.getByLabelText('Ex. : Blouse fleurie'),
      'Blouse fleurie',
    );
    await press('Continuer');

    // 2. Couleurs: the main colour is required
    expect(await screen.findByText('Étape 2/4')).toBeOnTheScreen();
    await press('Continuer');
    expect(await screen.findByText('Choisis une couleur')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getAllByRole('radio', { name: 'Rose poudré' })[0]!,
    );
    await press('Continuer');

    // 3. Style
    expect(await screen.findByText('Étape 3/4')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Romantique' }));
    await press('Continuer');

    // 4. Saison
    expect(await screen.findByText('Étape 4/4')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Printemps' }));
    await fireEvent.changeText(screen.getByLabelText('Min °C'), '12');
    await fireEvent.changeText(screen.getByLabelText('Max °C'), '24');
    await press('Ajouter à ma garde-robe');

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith('/piece/new-item'),
    );
    expect(api.create).toHaveBeenCalledWith({
      category: 'TOP',
      subcategory: 'blouse',
      name: 'Blouse fleurie',
      primaryColor: 'powderPink',
      secondaryColors: [],
      styles: ['romantic'],
      seasons: ['spring'],
      minTemperature: 12,
      maxTemperature: 24,
      status: 'AVAILABLE',
    });
  });

  it('refuses a temperature range upside down', async () => {
    await renderWithProviders(<AddWardrobeItemScreen />);
    await fireEvent.press(screen.getByRole('radio', { name: 'Haut' }));
    await press('Continuer');
    await fireEvent.press(
      (await screen.findAllByRole('radio', { name: 'Noir' }))[0]!,
    );
    await press('Continuer');
    await screen.findByText('Étape 3/4');
    await press('Continuer');
    await screen.findByText('Étape 4/4');

    await fireEvent.changeText(screen.getByLabelText('Min °C'), '20');
    await fireEvent.changeText(screen.getByLabelText('Max °C'), '5');
    await press('Ajouter à ma garde-robe');

    expect(
      await screen.findByText('Le maximum doit être supérieur au minimum'),
    ).toBeOnTheScreen();
    expect(api.create).not.toHaveBeenCalled();
  });
});

describe('WardrobeItemDetailsScreen', () => {
  const item = wardrobeItem({
    id: 'item-42',
    name: 'Blazer structuré',
    category: 'LAYER',
    primaryColor: 'sand',
    brand: 'Sézane',
    wearCount: 8,
  });

  beforeEach(() => {
    jest.mocked(useLocalSearchParams).mockReturnValue({ id: 'item-42' });
    api.get.mockResolvedValue(item);
  });

  it('shows the piece', async () => {
    await renderWithProviders(<WardrobeItemDetailsScreen />);

    expect(await screen.findByText('Blazer structuré')).toBeOnTheScreen();
    expect(screen.getByText('Sézane')).toBeOnTheScreen();
    expect(screen.getByText('Portée 8 fois')).toBeOnTheScreen();
  });

  it('marks the piece as in the wash', async () => {
    api.update.mockResolvedValue({ ...item, status: 'WASHING' });
    await renderWithProviders(<WardrobeItemDetailsScreen />);
    await screen.findByText('Blazer structuré');

    await fireEvent.press(screen.getByTestId('status-WASHING'));

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledWith('item-42', { status: 'WASHING' }),
    );
  });

  it('deletes the piece after confirmation', async () => {
    api.remove.mockResolvedValue(undefined);
    await renderWithProviders(<WardrobeItemDetailsScreen />);
    await screen.findByText('Blazer structuré');

    await press('Supprimer');
    const dialog = screen.getByText('Supprimer cette pièce ?').parent!.parent!;
    expect(api.remove).not.toHaveBeenCalled();
    await fireEvent.press(
      within(dialog).getByRole('button', { name: 'Supprimer' }),
    );

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(api.remove).toHaveBeenCalledWith('item-42');
  });
});

describe('EditWardrobeItemScreen', () => {
  it('saves the changes of an existing piece', async () => {
    const item = wardrobeItem({
      id: 'item-7',
      name: 'Pull',
      category: 'TOP',
      primaryColor: 'ecru',
    });
    jest.mocked(useLocalSearchParams).mockReturnValue({ id: 'item-7' });
    api.get.mockResolvedValue(item);
    api.update.mockResolvedValue({ ...item, name: 'Pull torsadé' });
    await renderWithProviders(<EditWardrobeItemScreen />);

    const name = await screen.findByLabelText('Ex. : Blouse fleurie');
    expect(name).toHaveProp('value', 'Pull');
    await fireEvent.changeText(name, 'Pull torsadé');
    await press('Enregistrer');

    await waitFor(() => expect(router.back).toHaveBeenCalled());
    expect(api.update).toHaveBeenCalledWith(
      'item-7',
      expect.objectContaining({
        name: 'Pull torsadé',
        category: 'TOP',
        primaryColor: 'ecru',
      }),
    );
  });
});
