import { compare, hash, hashSync } from 'bcrypt';

import type { PasswordHasher } from '../../domain/auth/ports/password-hasher';

export class BcryptPasswordHasher implements PasswordHasher {
  /** Hash of a random value with the same cost, used when there is no account to compare with. */
  private readonly dummyHash: string;

  constructor(private readonly cost: number) {
    this.dummyHash = hashSync(`dummy-${Math.random()}`, cost);
  }

  hash(plain: string): Promise<string> {
    return hash(plain, this.cost);
  }

  async verify(plain: string, passwordHash: string | null): Promise<boolean> {
    const matches = await compare(plain, passwordHash ?? this.dummyHash);
    return passwordHash !== null && matches;
  }
}
