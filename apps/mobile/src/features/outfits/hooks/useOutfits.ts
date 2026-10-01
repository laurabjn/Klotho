import type {
  GenerateOutfitsInput,
  Outfit,
  OutfitRole,
  OutfitVariantInput,
} from '@klotho/shared';
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';

import { outfitsApi } from '../api/outfits.api';

export const outfitKeys = {
  all: ['outfits'] as const,
  one: (id: string) => ['outfits', 'one', id] as const,
  recent: (limit: number) => ['outfits', 'recent', limit] as const,
  alternatives: (id: string, role: OutfitRole) =>
    ['outfits', 'alternatives', id, role] as const,
};

/** Every look the API sends back is known by id, then the lists refresh. */
function remember(queryClient: QueryClient, outfits: Outfit[]) {
  for (const outfit of outfits)
    queryClient.setQueryData(outfitKeys.one(outfit.id), outfit);
  void queryClient.invalidateQueries({ queryKey: ['outfits', 'recent'] });
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
