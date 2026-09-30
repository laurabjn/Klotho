import type {
  CreateWardrobeItemInput,
  ListWardrobeQueryInput,
  UpdateWardrobeItemInput,
  WardrobeItem,
} from '@klotho/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { wardrobeApi } from '../api/wardrobe.api';

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

export function useCreateWardrobeItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWardrobeItemInput) => wardrobeApi.create(body),
    onSuccess: (item) => {
      queryClient.setQueryData(wardrobeKeys.item(item.id), item);
      return queryClient.invalidateQueries({ queryKey: ['wardrobe', 'list'] });
    },
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
