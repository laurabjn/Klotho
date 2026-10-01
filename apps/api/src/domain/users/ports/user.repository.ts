import type { NewUser, ProfileChanges, User } from '../entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  /** @throws EmailAlreadyUsedError when the email is taken (including concurrent inserts). */
  create(user: NewUser): Promise<User>;
  updateProfile(id: string, changes: ProfileChanges): Promise<User>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  /** @throws EmailAlreadyUsedError when another account took the address meanwhile. */
  updateEmail(id: string, email: string): Promise<User>;
  /**
   * Deletes the account and, by cascade, everything it owns (sessions,
   * wardrobe, photo rows, profile, settings, looks, feedback, wears).
   * Returns false when the user does not exist.
   */
  delete(id: string): Promise<boolean>;
}

export const USER_REPOSITORY = Symbol('UserRepository');
