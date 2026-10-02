import {
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Linking } from 'react-native';

import { useGenerationDraftStore } from '@/features/outfits/store/generation-draft.store';
import { ApiError, NetworkError } from '@/lib/api/errors';
import { renderWithProviders } from '@/testing/render';

import { photosApi } from '../api/photos.api';
import { wardrobeApi } from '../api/wardrobe.api';
import { permissionState, pickPhoto } from '../photos/pick-photo';
import { page, wardrobeItem } from '../testing';
import { AddWardrobeItemScreen } from './AddWardrobeItemScreen';
import { EditWardrobeItemScreen } from './EditWardrobeItemScreen';
import { FavoritePiecesScreen } from './FavoritePiecesScreen';
import { WardrobeItemDetailsScreen } from './WardrobeItemDetailsScreen';
import { WardrobeScreen } from './WardrobeScreen';

jest.mock('../api/wardrobe.api');
jest.mock('../photos/pick-photo', () => ({
  pickPhoto: jest.fn(),
  permissionState: jest.fn(),
}));
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    navigate: jest.fn(),
    canGoBack: () => true,
  },
  useLocalSearchParams: jest.fn(() => ({})),
}));
const api = jest.mocked(wardrobeApi);

const press = (name: string) =>
  fireEvent.press(screen.getByRole('button', { name }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  jest.spyOn(Linking, 'openSettings').mockResolvedValue(undefined);
  // Permission already granted unless a test says otherwise.
  jest.mocked(permissionState).mockResolvedValue('granted');
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
      await screen.findByText('Mon dressing est encore vide'),
    ).toBeOnTheScreen();
    // Nothing to search in an empty wardrobe.
    expect(
      screen.queryByLabelText('Rechercher une pièce, une marque…'),
    ).not.toBeOnTheScreen();
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
    await press('Effacer les filtres');
    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: [] }),
      ),
    );
  });

  it('repeats the search that found nothing', async () => {
    api.list
      .mockResolvedValueOnce(page([wardrobeItem({ name: 'Blouse' })]))
      .mockResolvedValue(page([]));
    await renderWithProviders(<WardrobeScreen />);
    await screen.findByText('Blouse');

    await fireEvent.changeText(
      screen.getByLabelText('Rechercher une pièce, une marque…'),
      'veste rouge',
    );

    expect(
      await screen.findByText(
        'Aucune pièce ne correspond à ta recherche « veste rouge ».',
      ),
    ).toBeOnTheScreen();
  });

  it('offers to retry when the list cannot be loaded', async () => {
    api.list
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValue(page([]));
    await renderWithProviders(<WardrobeScreen />);

    expect(await screen.findByText('Problème de connexion')).toBeOnTheScreen();
    await press('Réessayer');
    expect(
      await screen.findByText('Mon dressing est encore vide'),
    ).toBeOnTheScreen();
  });

  it('tells a server error from a connection problem', async () => {
    api.list.mockRejectedValue(new ApiError(500, 'internal'));
    await renderWithProviders(<WardrobeScreen />);

    expect(
      await screen.findByText('Impossible de charger ta garde-robe.'),
    ).toBeOnTheScreen();
  });
});

describe('AddWardrobeItemScreen', () => {
  const localPhoto = (n: number) => ({
    uri: `file:///photo-${n}.jpg`,
    width: 1200,
    height: 1600,
  });

  /** Goes from the photo step to the colours step with a valid category. */
  async function toColorsStep() {
    await press('Continuer'); // photo step is optional
    await fireEvent.press(await screen.findByRole('radio', { name: 'Haut' }));
    await press('Continuer');
    await screen.findByLabelText('Étape 3/5');
  }

  async function finishWithBlack() {
    await fireEvent.press(screen.getAllByRole('radio', { name: 'Noir' })[0]!);
    await press('Continuer');
    await screen.findByLabelText('Étape 4/5');
    await press('Continuer');
    await screen.findByLabelText('Étape 5/5');
    await press('Ajouter à ma garde-robe');
  }

  it('starts with an optional photo step', async () => {
    await renderWithProviders(<AddWardrobeItemScreen />);

    expect(screen.getByLabelText('Étape 1/5')).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Ajouter une photo' }),
    ).toBeOnTheScreen();
    await press('Continuer');
    expect(await screen.findByLabelText('Étape 2/5')).toBeOnTheScreen();
  });

  it('requires a category before the next step', async () => {
    await renderWithProviders(<AddWardrobeItemScreen />);
    await press('Continuer');

    await press('Continuer');

    expect(await screen.findByText('Choisis une catégorie')).toBeOnTheScreen();
    expect(screen.getByLabelText('Étape 2/5')).toBeOnTheScreen();
  });

  it('uploads the chosen photos after creating the piece, main first', async () => {
    jest
      .mocked(pickPhoto)
      .mockResolvedValueOnce({ status: 'picked', photo: localPhoto(1) })
      .mockResolvedValueOnce({ status: 'picked', photo: localPhoto(2) });
    api.create.mockResolvedValue(wardrobeItem({ id: 'new-item' }));
    const upload = jest
      .spyOn(photosApi, 'upload')
      .mockImplementation((photo) =>
        Promise.resolve({ key: `key-${photo.uri}`, width: 1200, height: 1600 }),
      );
    const attach = jest
      .spyOn(photosApi, 'attach')
      .mockResolvedValue(wardrobeItem({ id: 'new-item' }));
    await renderWithProviders(<AddWardrobeItemScreen />);

    for (let i = 0; i < 2; i += 1) {
      await press('Ajouter une photo');
      await press('Choisir dans la galerie');
      await waitFor(() => expect(pickPhoto).toHaveBeenCalledTimes(i + 1));
    }
    // The second photo becomes the main one.
    await fireEvent.press(
      await screen.findByRole('button', {
        name: /Photo 2 sur 2, Définir comme principale/,
      }),
    );
    await toColorsStep();
    await finishWithBlack();

    expect(await screen.findByText('Photo ajoutée !')).toBeOnTheScreen();
    await press('Compléter les détails');
    expect(router.replace).toHaveBeenCalledWith('/piece/new-item/edit');
    expect(pickPhoto).toHaveBeenCalledWith('library');
    expect(upload.mock.calls.map(([photo]) => photo.uri)).toEqual([
      'file:///photo-2.jpg',
      'file:///photo-1.jpg',
    ]);
    expect(attach).toHaveBeenCalledWith('new-item', 'key-file:///photo-2.jpg');
  });

  it('keeps the piece when a photo fails, and says so', async () => {
    jest
      .mocked(pickPhoto)
      .mockResolvedValue({ status: 'picked', photo: localPhoto(1) });
    api.create.mockResolvedValue(wardrobeItem({ id: 'new-item' }));
    jest.spyOn(photosApi, 'upload').mockRejectedValue(new NetworkError());
    await renderWithProviders(<AddWardrobeItemScreen />);

    await press('Ajouter une photo');
    await press('Prendre une photo');
    await screen.findByRole('button', { name: /Photo 1 sur 1/ });
    await toColorsStep();
    await finishWithBlack();

    expect(
      await screen.findByText('Une erreur est survenue'),
    ).toBeOnTheScreen();
    expect(api.create).toHaveBeenCalledTimes(1);
    await press('Annuler');
    expect(router.replace).toHaveBeenCalledWith(
      '/piece/new-item?photosFailed=1',
    );
  });

  it('sends a failed photo again onto the created piece', async () => {
    jest
      .mocked(pickPhoto)
      .mockResolvedValue({ status: 'picked', photo: localPhoto(1) });
    api.create.mockResolvedValue(wardrobeItem({ id: 'new-item' }));
    jest
      .spyOn(photosApi, 'upload')
      .mockRejectedValueOnce(new NetworkError())
      .mockResolvedValue({ key: 'key-1', width: 1200, height: 1600 });
    const attach = jest
      .spyOn(photosApi, 'attach')
      .mockResolvedValue(wardrobeItem({ id: 'new-item' }));
    await renderWithProviders(<AddWardrobeItemScreen />);

    await press('Ajouter une photo');
    await press('Prendre une photo');
    await screen.findByRole('button', { name: /Photo 1 sur 1/ });
    await toColorsStep();
    await finishWithBlack();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Réessayer' }),
    );

    expect(await screen.findByText('Photo ajoutée !')).toBeOnTheScreen();
    expect(api.create).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledWith('new-item', 'key-1');
  });

  it('starts a new piece from the success screen', async () => {
    jest
      .mocked(pickPhoto)
      .mockResolvedValue({ status: 'picked', photo: localPhoto(1) });
    api.create.mockResolvedValue(wardrobeItem({ id: 'new-item' }));
    jest
      .spyOn(photosApi, 'upload')
      .mockResolvedValue({ key: 'key-1', width: 1200, height: 1600 });
    jest
      .spyOn(photosApi, 'attach')
      .mockResolvedValue(wardrobeItem({ id: 'new-item' }));
    await renderWithProviders(<AddWardrobeItemScreen />);

    await press('Ajouter une photo');
    await press('Prendre une photo');
    await screen.findByRole('button', { name: /Photo 1 sur 1/ });
    await toColorsStep();
    await finishWithBlack();
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Ajouter une autre pièce' }),
    );

    expect(screen.getByLabelText('Étape 1/5')).toBeOnTheScreen();
    expect(
      screen.queryByRole('button', { name: /Photo 1 sur 1/ }),
    ).not.toBeOnTheScreen();
  });

  it('explains why before the system permission dialog', async () => {
    jest.mocked(permissionState).mockResolvedValue('ask');
    jest.mocked(pickPhoto).mockResolvedValue({ status: 'canceled' });
    await renderWithProviders(<AddWardrobeItemScreen />);

    await press('Ajouter une photo');
    await press('Choisir dans la galerie');

    expect(
      await screen.findByText('Autoriser l’accès à tes photos'),
    ).toBeOnTheScreen();
    expect(pickPhoto).not.toHaveBeenCalled();
    await press('Autoriser l’accès');
    await waitFor(() => expect(pickPhoto).toHaveBeenCalledWith('library'));
  });

  it('asks nothing when the user chooses "Plus tard"', async () => {
    jest.mocked(permissionState).mockResolvedValue('ask');
    await renderWithProviders(<AddWardrobeItemScreen />);

    await press('Ajouter une photo');
    await press('Prendre une photo');
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Plus tard' }),
    );

    expect(
      screen.queryByText('Autoriser l’appareil photo'),
    ).not.toBeOnTheScreen();
    expect(pickPhoto).not.toHaveBeenCalled();
  });

  it('points to the settings when the permission was refused for good', async () => {
    jest.mocked(permissionState).mockResolvedValue('blocked');
    await renderWithProviders(<AddWardrobeItemScreen />);

    await press('Ajouter une photo');
    await press('Prendre une photo');

    expect(
      await screen.findByText('Autoriser l’appareil photo'),
    ).toBeOnTheScreen();
    expect(pickPhoto).not.toHaveBeenCalled();
    await press('Ouvrir les réglages');
    expect(Linking.openSettings).toHaveBeenCalled();
  });

  it('creates a piece through all the steps', async () => {
    api.create.mockResolvedValue(wardrobeItem({ id: 'new-item' }));
    await renderWithProviders(<AddWardrobeItemScreen />);

    // 1. Photo (skipped)
    await press('Continuer');

    // 2. Infos
    await fireEvent.press(await screen.findByRole('radio', { name: 'Haut' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Blouse' }));
    await fireEvent.changeText(
      screen.getByLabelText('Ex. : Blouse fleurie'),
      'Blouse fleurie',
    );
    await press('Continuer');

    // 3. Couleurs: the main colour is required
    expect(await screen.findByLabelText('Étape 3/5')).toBeOnTheScreen();
    await press('Continuer');
    expect(await screen.findByText('Choisis une couleur')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getAllByRole('radio', { name: 'Rose poudré' })[0]!,
    );
    await press('Continuer');

    // 4. Style
    expect(await screen.findByLabelText('Étape 4/5')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('checkbox', { name: 'Romantique' }));
    await press('Continuer');

    // 5. Saison
    expect(await screen.findByLabelText('Étape 5/5')).toBeOnTheScreen();
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
    await toColorsStep();
    await fireEvent.press(screen.getAllByRole('radio', { name: 'Noir' })[0]!);
    await press('Continuer');
    await screen.findByLabelText('Étape 4/5');
    await press('Continuer');
    await screen.findByLabelText('Étape 5/5');

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
    api.list.mockResolvedValue(page([]));
  });

  it('shows the piece', async () => {
    await renderWithProviders(<WardrobeItemDetailsScreen />);

    expect(await screen.findByText('Blazer structuré')).toBeOnTheScreen();
    expect(screen.getByText('Sézane')).toBeOnTheScreen();
    expect(screen.getByText('8 fois')).toBeOnTheScreen();
    expect(screen.getByText('Une pièce que tu adores !')).toBeOnTheScreen();
    expect(screen.getByText('Pas encore portée')).toBeOnTheScreen();
  });

  it('shows the pieces that go with it', async () => {
    const jeans = wardrobeItem({
      id: 'jeans',
      name: 'Jean droit',
      category: 'BOTTOM',
      primaryColor: 'denim',
    });
    api.list.mockResolvedValue(page([item, jeans]));
    await renderWithProviders(<WardrobeItemDetailsScreen />);

    expect(await screen.findByText('S’accorde avec')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Jean droit' }));
    expect(router.push).toHaveBeenCalledWith('/piece/jeans');
  });

  it('adds the piece to the favourites', async () => {
    api.favorite.mockResolvedValue({ ...item, isFavorite: true });
    await renderWithProviders(<WardrobeItemDetailsScreen />);
    await screen.findByText('Blazer structuré');

    await press('Ajouter aux favoris');

    await waitFor(() =>
      expect(api.favorite).toHaveBeenCalledWith('item-42', true),
    );
    expect(
      await screen.findByRole('button', { name: 'Retirer des favoris' }),
    ).toBeOnTheScreen();
  });

  it('creates an outfit around the piece', async () => {
    await renderWithProviders(<WardrobeItemDetailsScreen />);
    await screen.findByText('Blazer structuré');

    await press('Créer une tenue avec cette pièce');

    expect(useGenerationDraftStore.getState().mandatoryItem?.id).toBe(
      'item-42',
    );
    expect(router.navigate).toHaveBeenCalledWith('/inspirations');
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

  describe('photos', () => {
    const photo = (id: string, isMain: boolean) => ({
      id,
      url: `https://storage.test/${id}.jpg?signature=x`,
      width: 1200,
      height: 1600,
      isMain,
    });
    const withPhotos = {
      ...item,
      photos: [photo('p1', true), photo('p2', false)],
    };

    beforeEach(() => {
      api.get.mockResolvedValue(withPhotos);
    });

    it('shows the photos, the main one first', async () => {
      await renderWithProviders(<WardrobeItemDetailsScreen />);

      expect(await screen.findByLabelText('Photo 1 sur 2')).toBeOnTheScreen();
      expect(screen.getByLabelText('Photo 2 sur 2')).toBeOnTheScreen();
      expect(screen.getByText('Principale')).toBeOnTheScreen();
    });

    it('adds a photo from the gallery', async () => {
      jest.mocked(pickPhoto).mockResolvedValue({
        status: 'picked',
        photo: { uri: 'file:///new.jpg', width: 800, height: 600 },
      });
      jest
        .spyOn(photosApi, 'upload')
        .mockResolvedValue({ key: 'k', width: 800, height: 600 });
      const attach = jest.spyOn(photosApi, 'attach').mockResolvedValue({
        ...withPhotos,
        photos: [...withPhotos.photos, photo('p3', false)],
      });
      await renderWithProviders(<WardrobeItemDetailsScreen />);
      await screen.findByLabelText('Photo 1 sur 2');

      await press('Ajouter une photo');
      await press('Choisir dans la galerie');

      await waitFor(() => expect(attach).toHaveBeenCalledWith('item-42', 'k'));
      expect(await screen.findByLabelText('Photo 3 sur 3')).toBeOnTheScreen();
      // Let the button leave its loading state before the test ends.
      await waitFor(() =>
        expect(
          screen.getByRole('button', { name: 'Ajouter une photo' }).props
            .accessibilityState,
        ).toMatchObject({ busy: false }),
      );
    });

    it('deletes the displayed photo after confirmation', async () => {
      const remove = jest
        .spyOn(photosApi, 'remove')
        .mockResolvedValue({ ...withPhotos, photos: [photo('p2', true)] });
      await renderWithProviders(<WardrobeItemDetailsScreen />);
      await screen.findByLabelText('Photo 1 sur 2');

      await press('Supprimer la photo');
      expect(screen.getByText('Supprimer cette photo ?')).toBeOnTheScreen();
      const buttons = screen.getAllByRole('button', {
        name: 'Supprimer la photo',
      });
      await fireEvent.press(buttons[buttons.length - 1]!);

      await waitFor(() => expect(remove).toHaveBeenCalledWith('item-42', 'p1'));
      expect(await screen.findByLabelText('Photo 1 sur 1')).toBeOnTheScreen();
      await waitFor(() =>
        expect(
          screen.queryByText('Supprimer cette photo ?'),
        ).not.toBeOnTheScreen(),
      );
    });

    it('tells when photos of the add flow could not be uploaded', async () => {
      jest
        .mocked(useLocalSearchParams)
        .mockReturnValue({ id: 'item-42', photosFailed: '2' });
      await renderWithProviders(<WardrobeItemDetailsScreen />);

      expect(
        await screen.findByText(/2 photos n’ont pas pu être envoyées/),
      ).toBeOnTheScreen();
    });
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

describe('WardrobeScreen hearts', () => {
  it('adds a piece to the favourites from the grid', async () => {
    const skirt = wardrobeItem({ id: 'skirt', name: 'Jupe satinée' });
    // The server then lists it as a favourite.
    let favorite = false;
    api.list.mockImplementation(() =>
      Promise.resolve(page([{ ...skirt, isFavorite: favorite }])),
    );
    api.favorite.mockImplementation(() => {
      favorite = true;
      return Promise.resolve({ ...skirt, isFavorite: true });
    });
    await renderWithProviders(<WardrobeScreen />);

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Ajouter aux favoris' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Retirer des favoris' }),
    ).toBeOnTheScreen();
    expect(api.favorite).toHaveBeenCalledWith('skirt', true);
  });
});

describe('FavoritePiecesScreen', () => {
  it('lists the favourite pieces, by category', async () => {
    const cardigan = wardrobeItem({
      id: 'cardigan',
      name: 'Cardigan en maille',
      isFavorite: true,
    });
    api.list.mockResolvedValue(page([cardigan]));
    await renderWithProviders(<FavoritePiecesScreen />);

    expect(await screen.findByText('Cardigan en maille')).toBeOnTheScreen();
    expect(api.list).toHaveBeenCalledWith(
      expect.objectContaining({ favorite: 'true' }),
    );

    await fireEvent.press(screen.getByRole('radio', { name: 'Hauts' }));
    await waitFor(() =>
      expect(api.list).toHaveBeenLastCalledWith(
        expect.objectContaining({ favorite: 'true', category: ['TOP'] }),
      ),
    );
  });

  it('takes a piece out of the favourites', async () => {
    const cardigan = wardrobeItem({
      id: 'cardigan',
      name: 'Cardigan en maille',
      isFavorite: true,
    });
    api.list.mockResolvedValue(page([cardigan]));
    api.favorite.mockResolvedValue({ ...cardigan, isFavorite: false });
    await renderWithProviders(<FavoritePiecesScreen />);

    await fireEvent.press(
      await screen.findByRole('button', { name: 'Retirer des favoris' }),
    );

    await waitFor(() =>
      expect(api.favorite).toHaveBeenCalledWith('cardigan', false),
    );
  });
});
