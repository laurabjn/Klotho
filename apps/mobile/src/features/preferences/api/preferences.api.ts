import type { StyleProfile, StyleProfileInput } from '@klotho/shared';

import { request } from '@/lib/api/http';

export const preferencesApi = {
  get: () => request<StyleProfile>('/preferences/me', { auth: true }),
  /** Replaces the whole profile; also completes the onboarding. */
  save: (body: StyleProfileInput) =>
    request<StyleProfile>('/preferences/me', {
      method: 'PUT',
      body,
      auth: true,
    }),
};
