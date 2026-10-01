import { Logger, Module } from '@nestjs/common';

import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '../../../domain/auth/ports/password-hasher';
import { DeleteAccountUseCase } from '../../../application/users/delete-account.use-case';
import { GetCurrentUserUseCase } from '../../../application/users/get-current-user.use-case';
import { UpdateProfileUseCase } from '../../../application/users/update-profile.use-case';
import {
  FILE_STORAGE,
  type FileStorage,
} from '../../../domain/storage/ports/file-storage';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/users/ports/user.repository';
import {
  WARDROBE_REPOSITORY,
  type WardrobeRepository,
} from '../../../domain/wardrobe/ports/wardrobe.repository';
import { UsersController } from './users.controller';

const logger = new Logger('AccountDeletion');

@Module({
  controllers: [UsersController],
  providers: [
    {
      provide: GetCurrentUserUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) => new GetCurrentUserUseCase(users),
    },
    {
      provide: UpdateProfileUseCase,
      inject: [USER_REPOSITORY],
      useFactory: (users: UserRepository) => new UpdateProfileUseCase(users),
    },
    {
      provide: DeleteAccountUseCase,
      inject: [
        USER_REPOSITORY,
        PASSWORD_HASHER,
        WARDROBE_REPOSITORY,
        FILE_STORAGE,
      ],
      useFactory: (
        users: UserRepository,
        hasher: PasswordHasher,
        wardrobe: WardrobeRepository,
        storage: FileStorage,
      ) =>
        new DeleteAccountUseCase(users, hasher, wardrobe, storage, (failure) =>
          // The error name only: messages may hold keys or URLs.
          logger.warn(
            `Account deleted, but its ${failure.step} could not be removed from the storage (${
              failure.error instanceof Error ? failure.error.name : 'unknown'
            })`,
          ),
        ),
    },
  ],
})
export class UsersModule {}
