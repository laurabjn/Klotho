import { Injectable } from '@nestjs/common';

import type {
  NewUser,
  ProfileChanges,
  User,
} from '../../../domain/users/entities/user.entity';
import {
  EmailAlreadyUsedError,
  UserNotFoundError,
} from '../../../domain/users/errors';
import type { UserRepository } from '../../../domain/users/ports/user.repository';
import { isRecordNotFound, isUniqueViolation } from '../prisma-errors';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(user: NewUser): Promise<User> {
    try {
      return await this.prisma.user.create({ data: user });
    } catch (error) {
      if (isUniqueViolation(error)) throw new EmailAlreadyUsedError();
      throw error;
    }
  }

  async updateProfile(id: string, changes: ProfileChanges): Promise<User> {
    try {
      return await this.prisma.user.update({ where: { id }, data: changes });
    } catch (error) {
      if (isRecordNotFound(error)) throw new UserNotFoundError();
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    // deleteMany: no error when the user is already gone (concurrent calls).
    const { count } = await this.prisma.user.deleteMany({ where: { id } });
    return count > 0;
  }

  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    try {
      await this.prisma.user.update({ where: { id }, data: { passwordHash } });
    } catch (error) {
      if (isRecordNotFound(error)) throw new UserNotFoundError();
      throw error;
    }
  }
}
