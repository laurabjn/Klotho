export interface User {
  id: string;
  /** Always stored normalised (see normalizeEmail). */
  email: string;
  passwordHash: string;
  firstName: string;
  bio: string | null;
  /** Storage key of the profile photo (an upload of the user), or null. */
  avatarKey: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NewUser = Pick<User, 'email' | 'passwordHash' | 'firstName'>;

/** Fields a user may change through their profile. */
export type ProfileChanges = Partial<
  Pick<User, 'firstName' | 'bio' | 'avatarKey'>
>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
