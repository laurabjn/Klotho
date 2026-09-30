import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  createWardrobeItemSchema,
  listWardrobeQuerySchema,
  updateWardrobeItemSchema,
  type CreateWardrobeItem,
  type ListWardrobeQuery,
  type Page,
  type UpdateWardrobeItem,
  type WardrobeItem,
} from '@klotho/shared';

import { CreateWardrobeItemUseCase } from '../../../application/wardrobe/create-wardrobe-item.use-case';
import { DeleteWardrobeItemUseCase } from '../../../application/wardrobe/delete-wardrobe-item.use-case';
import { GetWardrobeItemUseCase } from '../../../application/wardrobe/get-wardrobe-item.use-case';
import { ListWardrobeItemsUseCase } from '../../../application/wardrobe/list-wardrobe-items.use-case';
import { UpdateWardrobeItemUseCase } from '../../../application/wardrobe/update-wardrobe-item.use-case';
import { CurrentUserId } from '../auth/current-user.decorator';
import { ZodValidationPipe } from '../validation/zod-validation.pipe';

@Controller('wardrobe')
export class WardrobeController {
  constructor(
    private readonly listItems: ListWardrobeItemsUseCase,
    private readonly createItem: CreateWardrobeItemUseCase,
    private readonly getItem: GetWardrobeItemUseCase,
    private readonly updateItem: UpdateWardrobeItemUseCase,
    private readonly deleteItem: DeleteWardrobeItemUseCase,
  ) {}

  @Get()
  list(
    @CurrentUserId() userId: string,
    @Query(new ZodValidationPipe(listWardrobeQuerySchema))
    query: ListWardrobeQuery,
  ): Promise<Page<WardrobeItem>> {
    return this.listItems.execute(userId, query);
  }

  @Post()
  create(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(createWardrobeItemSchema))
    body: CreateWardrobeItem,
  ): Promise<WardrobeItem> {
    return this.createItem.execute(userId, body);
  }

  @Get(':id')
  get(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<WardrobeItem> {
    return this.getItem.execute(userId, id);
  }

  @Patch(':id')
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateWardrobeItemSchema))
    body: UpdateWardrobeItem,
  ): Promise<WardrobeItem> {
    return this.updateItem.execute(userId, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.deleteItem.execute(userId, id);
  }
}
