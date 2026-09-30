import { WardrobeItemNotFoundError } from '../../domain/wardrobe/errors';
import type { WardrobeRepository } from '../../domain/wardrobe/ports/wardrobe.repository';

export class DeleteWardrobeItemUseCase {
  constructor(private readonly wardrobe: WardrobeRepository) {}

  async execute(userId: string, id: string): Promise<void> {
    if (!(await this.wardrobe.deleteOwned(userId, id))) {
      throw new WardrobeItemNotFoundError();
    }
  }
}
