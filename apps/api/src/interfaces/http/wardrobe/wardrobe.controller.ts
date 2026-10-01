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
  Put,
  Query,
} from '@nestjs/common';
import {
  attachPhotoSchema,
  createWardrobeItemSchema,
  listWardrobeQuerySchema,
  updateWardrobeItemSchema,
  type AttachPhotoInput,
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
import { AddWardrobePhotoUseCase } from '../../../application/wardrobe/photos/add-wardrobe-photo.use-case';
import { DeleteWardrobePhotoUseCase } from '../../../application/wardrobe/photos/delete-wardrobe-photo.use-case';
import { SetMainWardrobePhotoUseCase } from '../../../application/wardrobe/photos/set-main-wardrobe-photo.use-case';
import { SetWardrobeFavoriteUseCase } from '../../../application/wardrobe/toggle-wardrobe-favorite.use-case';
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
    private readonly addPhoto: AddWardrobePhotoUseCase,
    private readonly deletePhoto: DeleteWardrobePhotoUseCase,
    private readonly setMainPhoto: SetMainWardrobePhotoUseCase,
    private readonly setFavorite: SetWardrobeFavoriteUseCase,
  ) {}

  /** Attaches a picture sent to POST /uploads/wardrobe; returns the updated item. */
  @Post(':id/photos')
  attachPhoto(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(attachPhotoSchema)) body: AttachPhotoInput,
  ): Promise<WardrobeItem> {
    return this.addPhoto.execute(userId, id, body.key);
  }

  @Delete(':id/photos/:photoId')
  removePhoto(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ): Promise<WardrobeItem> {
    return this.deletePhoto.execute(userId, id, photoId);
  }

  @Patch(':id/photos/:photoId/main')
  makeMainPhoto(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Param('photoId') photoId: string,
  ): Promise<WardrobeItem> {
    return this.setMainPhoto.execute(userId, id, photoId);
  }

  /** "Mes pièces favorites"; idempotent. */
  @Put(':id/favorite')
  addFavorite(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<WardrobeItem> {
    return this.setFavorite.execute(userId, id, true);
  }

  @Delete(':id/favorite')
  removeFavorite(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
  ): Promise<WardrobeItem> {
    return this.setFavorite.execute(userId, id, false);
  }

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
