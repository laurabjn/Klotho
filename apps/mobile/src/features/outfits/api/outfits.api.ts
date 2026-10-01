import type {
  GenerateOutfitsInput,
  Outfit,
  OutfitAlternative,
  OutfitRole,
  OutfitVariantInput,
} from '@klotho/shared';

import { request } from '@/lib/api/http';

export const outfitsApi = {
  generate: (body: GenerateOutfitsInput) =>
    request<Outfit[]>('/outfits/generate', {
      method: 'POST',
      body,
      auth: true,
    }),
  recent: (limit: number) =>
    request<Outfit[]>(`/outfits?limit=${limit}`, { auth: true }),
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
};
