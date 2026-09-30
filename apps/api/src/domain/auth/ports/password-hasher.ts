export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  /**
   * With a null hash (unknown account), still spends the same time as a real
   * comparison and returns false, so response times do not reveal accounts.
   */
  verify(plain: string, hash: string | null): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol('PasswordHasher');
