import type { AiCredits } from '@klotho/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import i18n from '@/i18n';
import type { LocalPhoto } from '@/features/wardrobe/photos/pick-photo';

import { aiApi } from '../api/ai.api';

const creditsKey = ['ai', 'credits'] as const;

export function useAiCredits() {
  return useQuery({ queryKey: creditsKey, queryFn: aiApi.credits });
}

export function useAnalyzePhoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photo: LocalPhoto) =>
      aiApi.analyzePhoto(photo, i18n.language === 'en' ? 'en' : 'fr'),
    onSuccess: ({ credits }) =>
      queryClient.setQueryData<AiCredits>(creditsKey, credits),
    // A refused analysis (quota) may mean the count shown is outdated.
    onError: () => queryClient.invalidateQueries({ queryKey: creditsKey }),
  });
}
