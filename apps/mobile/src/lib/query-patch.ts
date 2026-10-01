import type { QueryClient, QueryKey } from '@tanstack/react-query';

/** Where an entity may be nested in the cached answers. */
const NESTED = ['pages', 'items', 'outfit', 'pieces', 'item'];

/**
 * Applies `changes` to every cached copy of the entity `id` under `root`
 * (detail, lists, pages, looks' pieces…), so that a heart answers at once
 * everywhere. Returns how to undo it.
 */
export function patchCached(
  queryClient: QueryClient,
  root: QueryKey,
  id: string,
  changes: object,
): () => void {
  const patch = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(patch);
    if (!value || typeof value !== 'object') return value;
    const record = value as Record<string, unknown>;
    if (record.id === id) return { ...record, ...changes };
    const nested = NESTED.filter((key) => key in record);
    if (nested.length === 0) return value;
    const next = { ...record };
    for (const key of nested) next[key] = patch(record[key]);
    return next;
  };

  const snapshot = queryClient.getQueriesData({ queryKey: root });
  queryClient.setQueriesData({ queryKey: root }, patch);
  return () => {
    for (const [key, data] of snapshot) queryClient.setQueryData(key, data);
  };
}
