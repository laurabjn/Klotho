import type { FileStorage } from '../../domain/storage/ports/file-storage';
import { WardrobeItemNotFoundError } from '../../domain/wardrobe/errors';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';

export class DeleteWardrobeItemUseCase {
  constructor(
    private readonly wardrobe: WardrobeRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(userId: string, id: string): Promise<void> {
    const item = await this.wardrobe.findOwned(userId, id);
    if (!item || !(await this.wardrobe.deleteOwned(userId, id))) {
      throw new WardrobeItemNotFoundError();
    }
    // Photo rows are gone with the item (cascade); their files must go too.
    await this.storage.delete(item.photos.map((photo) => photo.storageKey));
  }
}
