export interface User {
  id: string;
  /** Always stored normalised (see normalizeEmail). */
  email: string;
  passwordHash: string;
  firstName: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type NewUser = Pick<User, 'email' | 'passwordHash' | 'firstName'>;

/** Fields a user may change through their profile. */
export type ProfileChanges = Partial<Pick<User, 'firstName' | 'avatarUrl'>>;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
