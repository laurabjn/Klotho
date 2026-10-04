import type { AiCredits, WardrobePhotoAnalysis } from '@klotho/shared';
import { File } from 'expo-file-system';

import { request } from '@/lib/api/http';

import type { LocalPhoto } from '@/features/wardrobe/photos/pick-photo';

export const aiApi = {
  credits: () => request<AiCredits>('/ai/credits', { auth: true }),
  /** Uploads the photo and returns what the AI proposes for the piece. */
  analyzePhoto: (photo: LocalPhoto, language: 'fr' | 'en') => {
    const form = new FormData();
    // Same as photosApi.upload: expo/fetch needs a real File.
    form.append('file', new File(photo.uri));
    return request<WardrobePhotoAnalysis>(
      `/ai/wardrobe-photo?language=${language}`,
      { method: 'POST', form, auth: true },
    );
  },
};
