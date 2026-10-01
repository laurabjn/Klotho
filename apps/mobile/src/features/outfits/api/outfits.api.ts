import type {
  GenerateOutfitsInput,
  ListOutfitsQueryInput,
  Outfit,
  OutfitAlternative,
  OutfitFeedbackInput,
  OutfitHistoryQueryInput,
  OutfitRole,
  OutfitVariantInput,
  OutfitWear,
  Page,
} from '@klotho/shared';

import { request } from '@/lib/api/http';

function toQueryString(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (value !== undefined && value !== null) params.set(key, String(value));
  const search = params.toString();
  return search ? `?${search}` : '';
}

export const outfitsApi = {
  generate: (body: GenerateOutfitsInput) =>
    request<Outfit[]>('/outfits/generate', {
      method: 'POST',
      body,
      auth: true,
    }),
  /** "Mes tenues": generated, favourite or worn looks. */
  list: (query: ListOutfitsQueryInput) =>
    request<Page<Outfit>>(`/outfits${toQueryString(query)}`, { auth: true }),
  /** The latest looks, most recent first. */
  recent: async (limit: number) =>
    (await outfitsApi.list({ filter: 'generated', pageSize: limit })).items,
  get: (id: string) => request<Outfit>(`/outfits/${id}`, { auth: true }),
  alternatives: (id: string, role: OutfitRole) =>
    request<OutfitAlternative[]>(`/outfits/${id}/alternatives?role=${role}`, {
      auth: true,
    }),
  replaceItem: (id: string, role: OutfitRole, replacementItemId: string) =>
    request<Outfit>(`/outfits/${id}/replace-item`, {
      method: 'POST',
      body: { role, replacementItemId },
      auth: true,
    }),
  variant: (id: string, body: OutfitVariantInput) =>
    request<Outfit>(`/outfits/${id}/variant`, {
      method: 'POST',
      body,
      auth: true,
    }),
  feedback: (id: string, body: OutfitFeedbackInput) =>
    request<Outfit>(`/outfits/${id}/feedback`, {
      method: 'POST',
      body,
      auth: true,
    }),
  favorite: (id: string, favorite: boolean) =>
    request<Outfit>(`/outfits/${id}/favorite`, {
      method: favorite ? 'POST' : 'DELETE',
      auth: true,
    }),
  /** "Marquer comme portée" on that day (YYYY-MM-DD). */
  wear: (id: string, wornOn: string) =>
    request<OutfitWear>(`/outfits/${id}/wear`, {
      method: 'POST',
      body: { wornOn },
      auth: true,
    }),
  history: (query: OutfitHistoryQueryInput) =>
    request<Page<OutfitWear>>(`/outfits/history${toQueryString(query)}`, {
      auth: true,
    }),
  removeWear: (wearId: string) =>
    request<void>(`/outfits/history/${wearId}`, {
      method: 'DELETE',
      auth: true,
    }),
};
