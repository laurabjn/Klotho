import type { WardrobeItem } from '@klotho/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { photosApi } from '../api/photos.api';
import type { LocalPhoto } from '../photos/pick-photo';
import { wardrobeKeys } from './useWardrobe';

/** Every photo endpoint returns the updated item: store it, refresh the lists. */
function usePhotoMutation<TVariables>(
  itemId: string,
  mutationFn: (variables: TVariables) => Promise<WardrobeItem>,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (item) => {
      queryClient.setQueryData(wardrobeKeys.item(itemId), item);
      return queryClient.invalidateQueries({ queryKey: ['wardrobe', 'list'] });
    },
  });
}

export function useAddPhoto(itemId: string) {
  return usePhotoMutation(itemId, async (photo: LocalPhoto) => {
    const { key } = await photosApi.upload(photo);
    return photosApi.attach(itemId, key);
  });
}

export function useDeletePhoto(itemId: string) {
  return usePhotoMutation(itemId, (photoId: string) =>
    photosApi.remove(itemId, photoId),
  );
}

export function useSetMainPhoto(itemId: string) {
  return usePhotoMutation(itemId, (photoId: string) =>
    photosApi.setMain(itemId, photoId),
  );
}
