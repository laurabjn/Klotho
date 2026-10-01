import type {
  CreateWardrobeItemInput,
  ListWardrobeQueryInput,
  Page,
  UpdateWardrobeItemInput,
  WardrobeItem,
} from '@klotho/shared';

import { request } from '@/lib/api/http';

function toQueryString(query: ListWardrobeQueryInput): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0)
    ) {
      continue;
    }
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const search = params.toString();
  return search ? `?${search}` : '';
}

export const wardrobeApi = {
  list: (query: ListWardrobeQueryInput) =>
    request<Page<WardrobeItem>>(`/wardrobe${toQueryString(query)}`, {
      auth: true,
    }),
  get: (id: string) => request<WardrobeItem>(`/wardrobe/${id}`, { auth: true }),
  create: (body: CreateWardrobeItemInput) =>
    request<WardrobeItem>('/wardrobe', { method: 'POST', body, auth: true }),
  update: (id: string, body: UpdateWardrobeItemInput) =>
    request<WardrobeItem>(`/wardrobe/${id}`, {
      method: 'PATCH',
      body,
      auth: true,
    }),
  favorite: (id: string, favorite: boolean) =>
    request<WardrobeItem>(`/wardrobe/${id}/favorite`, {
      method: favorite ? 'PUT' : 'DELETE',
      auth: true,
    }),
  remove: (id: string) =>
    request<void>(`/wardrobe/${id}`, { method: 'DELETE', auth: true }),
};
