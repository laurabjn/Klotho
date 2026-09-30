import { Module } from '@nestjs/common';

import { CreateWardrobeItemUseCase } from '../../../application/wardrobe/create-wardrobe-item.use-case';
import { DeleteWardrobeItemUseCase } from '../../../application/wardrobe/delete-wardrobe-item.use-case';
import { GetWardrobeItemUseCase } from '../../../application/wardrobe/get-wardrobe-item.use-case';
import { ListWardrobeItemsUseCase } from '../../../application/wardrobe/list-wardrobe-items.use-case';
import { UpdateWardrobeItemUseCase } from '../../../application/wardrobe/update-wardrobe-item.use-case';
import {
  WARDROBE_REPOSITORY,
  type WardrobeRepository,
} from '../../../domain/wardrobe/ports/wardrobe.repository';
import { WardrobeController } from './wardrobe.controller';

const useCases = [
  ListWardrobeItemsUseCase,
  CreateWardrobeItemUseCase,
  GetWardrobeItemUseCase,
  UpdateWardrobeItemUseCase,
  DeleteWardrobeItemUseCase,
];

@Module({
  controllers: [WardrobeController],
  // Every wardrobe use case only needs the repository.
  providers: useCases.map((UseCase) => ({
    provide: UseCase,
    inject: [WARDROBE_REPOSITORY],
    useFactory: (wardrobe: WardrobeRepository) => new UseCase(wardrobe),
  })),
})
export class WardrobeModule {}
