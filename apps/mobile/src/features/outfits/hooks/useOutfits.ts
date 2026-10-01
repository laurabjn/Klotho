import type {
  GenerateOutfitsInput,
  Outfit,
  OutfitFeedbackInput,
  OutfitListFilter,
  OutfitRole,
  OutfitVariantInput,
} from '@klotho/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { patchCached } from '@/lib/query-patch';

import { outfitsApi } from '../api/outfits.api';

export const outfitKeys = {
  all: ['outfits'] as const,
  one: (id: string) => ['outfits', 'one', id] as const,
  recent: (limit: number) => ['outfits', 'recent', limit] as const,
  alternatives: (id: string, role: OutfitRole) =>
    ['outfits', 'alternatives', id, role] as const,
  list: (filter: OutfitListFilter) => ['outfits', 'list', filter] as const,
  history: (range: HistoryRange) => ['outfits', 'history', range] as const,
};

/** A period of the history, days included (YYYY-MM-DD); open when omitted. */
export interface HistoryRange {
  from?: string;
  to?: string;
}

const PAGE_SIZE = 20;

/** Every look the API sends back is known by id, then the lists refresh. */
function remember(queryClient: QueryClient, outfits: Outfit[]) {
  for (const outfit of outfits)
    queryClient.setQueryData(outfitKeys.one(outfit.id), outfit);
  void queryClient.invalidateQueries({ queryKey: ['outfits', 'recent'] });
  void queryClient.invalidateQueries({ queryKey: ['outfits', 'list'] });
}

/** After a look is worn or un-worn: history, lists and pieces' counters. */
function refreshWorn(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: ['outfits'] });
  void queryClient.invalidateQueries({ queryKey: ['wardrobe'] });
}

export function useGenerateOutfits() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: GenerateOutfitsInput) => outfitsApi.generate(body),
    onSuccess: (outfits) => remember(queryClient, outfits),
  });
}

export function useOutfit(id: string) {
  return useQuery({
    queryKey: outfitKeys.one(id),
    queryFn: () => outfitsApi.get(id),
  });
}

export function useOutfitList(ids: string[]) {
  return useQueries({
    queries: ids.map((id) => ({
      queryKey: outfitKeys.one(id),
      queryFn: () => outfitsApi.get(id),
    })),
  });
}

export function useRecentOutfits(limit: number) {
  return useQuery({
    queryKey: outfitKeys.recent(limit),
    queryFn: () => outfitsApi.recent(limit),
  });
}

export function useOutfitAlternatives(id: string, role: OutfitRole | null) {
  return useQuery({
    queryKey: outfitKeys.alternatives(id, role ?? 'top'),
    queryFn: () => outfitsApi.alternatives(id, role!),
    enabled: role !== null,
  });
}

export function useReplaceOutfitItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      role,
      replacementItemId,
    }: {
      role: OutfitRole;
      replacementItemId: string;
    }) => outfitsApi.replaceItem(id, role, replacementItemId),
    onSuccess: (outfit) => {
      remember(queryClient, [outfit]);
      void queryClient.invalidateQueries({
        queryKey: ['outfits', 'alternatives', id],
      });
    },
  });
}

export function useCreateVariant(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OutfitVariantInput) => outfitsApi.variant(id, body),
    onSuccess: (outfit) => remember(queryClient, [outfit]),
  });
}

/** "Mes tenues": generated, favourite or worn looks, page after page. */
export function useOutfitPages(filter: OutfitListFilter) {
  return useInfiniteQuery({
    queryKey: outfitKeys.list(filter),
    queryFn: ({ pageParam }) =>
      outfitsApi.list({ filter, page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}

/** How many favourite looks ("Moi" counter). */
export function useFavoriteOutfitCount() {
  return useQuery({
    queryKey: [...outfitKeys.list('favorites'), 'count'],
    queryFn: async () =>
      (await outfitsApi.list({ filter: 'favorites', pageSize: 1 })).total,
  });
}

export function useToggleOutfitFavorite(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (favorite: boolean) => outfitsApi.favorite(id, favorite),
    // The heart answers at once everywhere; the server's answer then takes over.
    onMutate: (favorite) => ({
      undo: patchCached(queryClient, outfitKeys.all, id, {
        isFavorite: favorite,
      }),
    }),
    onError: (_error, _favorite, context) => context?.undo(),
    onSuccess: (outfit) => remember(queryClient, [outfit]),
  });
}

export function useOutfitFeedback(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OutfitFeedbackInput) => outfitsApi.feedback(id, body),
    onSuccess: (outfit) => remember(queryClient, [outfit]),
  });
}

/** "Marquer comme portée", on the given day. */
export function useMarkWorn(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (wornOn: string) => outfitsApi.wear(id, wornOn),
    onSuccess: (wear) => {
      queryClient.setQueryData(outfitKeys.one(id), wear.outfit);
      refreshWorn(queryClient);
    },
  });
}

export function useRemoveWear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (wearId: string) => outfitsApi.removeWear(wearId),
    onSuccess: () => refreshWorn(queryClient),
  });
}

/** Worn looks of a period (a month of the calendar, a day). */
export function useWornLooks(range: HistoryRange) {
  return useQuery({
    queryKey: outfitKeys.history(range),
    queryFn: async () =>
      (await outfitsApi.history({ ...range, pageSize: 100 })).items,
  });
}

/** "Historique de mes tenues", page after page. */
export function useWearHistory() {
  return useInfiniteQuery({
    queryKey: [...outfitKeys.history({}), 'pages'],
    queryFn: ({ pageParam }) =>
      outfitsApi.history({ page: pageParam, pageSize: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.hasMore ? last.page + 1 : undefined),
  });
}
