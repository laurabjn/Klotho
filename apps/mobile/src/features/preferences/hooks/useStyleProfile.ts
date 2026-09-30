import {
  styleProfileSchema,
  type StyleProfile,
  type StyleProfileFields,
} from '@klotho/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { preferencesApi } from '../api/preferences.api';

export const styleProfileKey = ['preferences', 'me'] as const;

/** What "Passer pour l'instant" saves: every preference left unset. */
export const EMPTY_STYLE_PROFILE: StyleProfileFields = styleProfileSchema.parse(
  {},
);

export function useStyleProfile() {
  return useQuery({ queryKey: styleProfileKey, queryFn: preferencesApi.get });
}

export function useSaveStyleProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profile: StyleProfileFields) => preferencesApi.save(profile),
    onSuccess: (profile: StyleProfile) =>
      queryClient.setQueryData(styleProfileKey, profile),
  });
}

/** The editable part of a profile returned by the API. */
export function toFields({
  onboardingCompleted: _done,
  ...fields
}: StyleProfile): StyleProfileFields {
  return fields;
}
