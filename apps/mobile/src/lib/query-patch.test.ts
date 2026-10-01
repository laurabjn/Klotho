import { QueryClient } from '@tanstack/react-query';

import { patchCached } from './query-patch';

describe('patchCached', () => {
  it('changes every copy of the entity, and can undo it', () => {
    const client = new QueryClient();
    const piece = { id: 'p1', category: 'TOP', isFavorite: false };
    client.setQueryData(['wardrobe', 'item', 'p1'], piece);
    client.setQueryData(['wardrobe', 'list', {}], {
      pages: [{ items: [piece, { id: 'p2', isFavorite: false }] }],
    });
    client.setQueryData(['outfits', 'one', 'o1'], {
      id: 'o1',
      pieces: [{ role: 'top', item: piece }],
    });

    const undo = [['wardrobe'], ['outfits']].map((root) =>
      patchCached(client, root, 'p1', { isFavorite: true }),
    );

    expect(client.getQueryData(['wardrobe', 'item', 'p1'])).toMatchObject({
      isFavorite: true,
    });
    expect(client.getQueryData(['wardrobe', 'list', {}])).toEqual({
      pages: [
        {
          items: [
            { ...piece, isFavorite: true },
            { id: 'p2', isFavorite: false },
          ],
        },
      ],
    });
    expect(client.getQueryData(['outfits', 'one', 'o1'])).toMatchObject({
      pieces: [{ item: { isFavorite: true } }],
    });

    undo.forEach((step) => step());
    expect(client.getQueryData(['wardrobe', 'item', 'p1'])).toEqual(piece);
  });
});
