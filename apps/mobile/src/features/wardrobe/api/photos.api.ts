import type { UploadedPhoto, WardrobeItem } from '@klotho/shared';
import { File } from 'expo-file-system';

import { request } from '@/lib/api/http';

import type { LocalPhoto } from '../photos/pick-photo';

export const photosApi = {
  /** Step 1: sends the picture; the server re-encodes it and strips its metadata. */
  upload: (photo: LocalPhoto) => {
    const form = new FormData();
    // Expo replaces the global fetch with expo/fetch, which does not support
    // React Native's { uri, name, type } parts: send a real File (a Blob).
    form.append('file', new File(photo.uri));
    return request<UploadedPhoto>('/uploads/wardrobe', {
      method: 'POST',
      form,
      auth: true,
    });
  },
  /** Step 2: attaches the uploaded picture to the item. */
  attach: (itemId: string, key: string) =>
    request<WardrobeItem>(`/wardrobe/${itemId}/photos`, {
      method: 'POST',
      body: { key },
      auth: true,
    }),
  remove: (itemId: string, photoId: string) =>
    request<WardrobeItem>(`/wardrobe/${itemId}/photos/${photoId}`, {
      method: 'DELETE',
      auth: true,
    }),
  setMain: (itemId: string, photoId: string) =>
    request<WardrobeItem>(`/wardrobe/${itemId}/photos/${photoId}/main`, {
      method: 'PATCH',
      auth: true,
    }),
};

/** Upload then attach, one photo after the other (order = display order). */
export async function addPhotos(
  itemId: string,
  photos: LocalPhoto[],
): Promise<{ item: WardrobeItem | null; failed: number }> {
  let item: WardrobeItem | null = null;
  let failed = 0;
  for (const photo of photos) {
    try {
      const { key } = await photosApi.upload(photo);
      item = await photosApi.attach(itemId, key);
    } catch {
      failed += 1;
    }
  }
  return { item, failed };
}
