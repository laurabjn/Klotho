import { Module } from '@nestjs/common';

import { GetCurrentUserUseCase } from '../../../application/users/get-current-user.use-case';
import { UpdateProfileUseCase } from '../../../application/users/update-profile.use-case';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../domain/users/ports/user.repository';
import { UsersController } from './users.controller';

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
  ],
})
export class UsersModule {}
