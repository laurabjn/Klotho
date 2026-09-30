import type { NewUser, ProfileChanges, User } from '../entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /** @throws EmailAlreadyUsedError when the email is taken (including concurrent inserts). */
  create(user: NewUser): Promise<User>;
  updateProfile(id: string, changes: ProfileChanges): Promise<User>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
