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

/**
 * Upload then attach, one photo after the other (order = display order).
 * `onProgress` gets the share done, from 0 to 1, after each step.
 */
export async function addPhotos(
  itemId: string,
  photos: LocalPhoto[],
  onProgress?: (share: number) => void,
): Promise<{
  item: WardrobeItem | null;
  failed: number;
  /** To send again. */
  failedPhotos: LocalPhoto[];
}> {
  let item: WardrobeItem | null = null;
  const failedPhotos: LocalPhoto[] = [];
  const steps = photos.length * 2;
  let done = 0;
  const step = () => onProgress?.(++done / steps);
  for (const [index, photo] of photos.entries()) {
    try {
      const { key } = await photosApi.upload(photo);
      step();
      item = await photosApi.attach(itemId, key);
      step();
    } catch {
      failedPhotos.push(photo);
      done = (index + 1) * 2;
      onProgress?.(done / steps);
    }
  }
  return { item, failed: failedPhotos.length, failedPhotos };
}
