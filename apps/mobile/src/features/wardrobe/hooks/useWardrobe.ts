import {
  WARDROBE_PAGE_SIZE_MAX,
  type CreateWardrobeItemInput,
  type ListWardrobeQueryInput,
  type Style,
  type UpdateWardrobeItemInput,
  type WardrobeItem,
} from '@klotho/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { showToast } from '@/components/ui/Toast';
import i18n from '@/i18n';
import { patchCached } from '@/lib/query-patch';

import { addPhotos } from '../api/photos.api';
import { wardrobeApi } from '../api/wardrobe.api';
import type { LocalPhoto } from '../photos/pick-photo';

export type WardrobeListFilters = Omit<
  ListWardrobeQueryInput,
  'page' | 'pageSize'
>;

const PAGE_SIZE = 24;

export const wardrobeKeys = {
  all: ['wardrobe'] as const,
  list: (filters: WardrobeListFilters) =>
    ['wardrobe', 'list', filters] as const,
  item: (id: string) => ['wardrobe', 'item', id] as const,
};

/** Paginated list: pages are fetched as the user scrolls. */
export function useWardrobeList(filters: WardrobeListFilters) {
  return useInfiniteQuery({
    queryKey: wardrobeKeys.list(filters),
    queryFn: ({ pageParam }) =>
      wardrobeApi.list({ ...filters, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

/** How many pieces, and the style found on most of them (profile card). */
export function useWardrobeStats() {
  return useQuery({
    queryKey: [...wardrobeKeys.all, 'stats'],
    queryFn: async () => {
      // One page of the maximum size: enough for the dominant style.
      const page = await wardrobeApi.list({ pageSize: WARDROBE_PAGE_SIZE_MAX });
      const counts = new Map<Style, number>();
      for (const item of page.items)
        for (const style of item.styles)
          counts.set(style, (counts.get(style) ?? 0) + 1);
      const dominantStyle =
        [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return { total: page.total, dominantStyle };
    },
  });
}

export function useWardrobeItem(id: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: wardrobeKeys.item(id),
    queryFn: () => wardrobeApi.get(id),
    // Show what the list already knows while the detail loads.
    placeholderData: () =>
      queryClient
        .getQueriesData<{ pages: { items: WardrobeItem[] }[] }>({
          queryKey: ['wardrobe', 'list'],
        })
        .flatMap(([, data]) => data?.pages.flatMap((page) => page.items) ?? [])
        .find((item) => item.id === id),
  });
}

export function useUpdateWardrobeItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateWardrobeItemInput) => wardrobeApi.update(id, body),
    onSuccess: (item) => {
      queryClient.setQueryData(wardrobeKeys.item(id), item);
      return queryClient.invalidateQueries({ queryKey: ['wardrobe', 'list'] });
    },
  });
}

/** The heart of a piece ("Mes pièces favorites"). */
export function useToggleItemFavorite(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (favorite: boolean) => wardrobeApi.favorite(id, favorite),
    // Every copy of the piece (lists, details, looks) changes at once.
    onMutate: (favorite) => {
      const undo = [wardrobeKeys.all, ['outfits']].map((root) =>
        patchCached(queryClient, root, id, { isFavorite: favorite }),
      );
      return { undo: () => undo.forEach((step) => step()) };
    },
    onError: (_error, _favorite, context) => context?.undo(),
    onSuccess: (item) => {
      if (item.isFavorite)
        showToast(i18n.t('notifications.toast.favoritePiece'));
      queryClient.setQueryData(wardrobeKeys.item(id), item);
      return queryClient.invalidateQueries({ queryKey: ['wardrobe', 'list'] });
    },
  });
}

export function useDeleteWardrobeItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => wardrobeApi.remove(id),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: wardrobeKeys.item(id) });
      return queryClient.invalidateQueries({ queryKey: ['wardrobe', 'list'] });
    },
  });
}

/**
 * Creates the piece, then uploads its photos one by one. A photo that fails
 * does not cancel the piece: the number of failures is returned instead.
 */
export function useCreateWardrobeItemWithPhotos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      body,
      photos,
    }: {
      body: CreateWardrobeItemInput;
      photos: LocalPhoto[];
    }) => {
      const created = await wardrobeApi.create(body);
      const { item, failed } = await addPhotos(created.id, photos);
      return { item: item ?? created, failed };
    },
    onSuccess: ({ item }) => {
      queryClient.setQueryData(wardrobeKeys.item(item.id), item);
      return queryClient.invalidateQueries({ queryKey: ['wardrobe', 'list'] });
    },
  });
}
