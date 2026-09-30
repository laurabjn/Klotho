// In-memory implementations of domain ports, for use case unit tests.
import type {
  AccessToken,
  AccessTokenService,
} from '../domain/auth/ports/access-token.service';
import type { PasswordHasher } from '../domain/auth/ports/password-hasher';
import type {
  NewPasswordResetToken,
  PasswordResetTokenRecord,
  PasswordResetTokenRepository,
} from '../domain/auth/ports/password-reset-token.repository';
import type {
  NewRefreshToken,
  RefreshTokenRecord,
  RefreshTokenRepository,
} from '../domain/auth/ports/refresh-token.repository';
import type { SecureTokenGenerator } from '../domain/auth/ports/secure-token.generator';
import type {
  Mailer,
  PasswordResetEmail,
} from '../domain/notifications/ports/mailer';
import type { Clock } from '../domain/shared/ports/clock';
import type {
  NewUser,
  ProfileChanges,
  User,
} from '../domain/users/entities/user.entity';
import {
  EmailAlreadyUsedError,
  UserNotFoundError,
} from '../domain/users/errors';
import type { UserRepository } from '../domain/users/ports/user.repository';

export class FixedClock implements Clock {
  constructor(private current = new Date('2026-10-01T08:00:00.000Z')) {}

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

export const MINUTE = 60_000;
export const DAY = 24 * 60 * MINUTE;

export class InMemoryUserRepository implements UserRepository {
  readonly users = new Map<string, User>();
  private sequence = 0;

  constructor(private readonly clock: Clock) {}

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.get(id) ?? null);
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(
      [...this.users.values()].find((u) => u.email === email) ?? null,
    );
  }

  create(user: NewUser): Promise<User> {
    if ([...this.users.values()].some((u) => u.email === user.email)) {
      return Promise.reject(new EmailAlreadyUsedError());
    }
    const now = this.clock.now();
    const created: User = {
      ...user,
      id: `user-${++this.sequence}`,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(created.id, created);
    return Promise.resolve(created);
  }

  updateProfile(id: string, changes: ProfileChanges): Promise<User> {
    const user = this.users.get(id);
    if (!user) return Promise.reject(new UserNotFoundError());
    const updated = { ...user, ...changes, updatedAt: this.clock.now() };
    this.users.set(id, updated);
    return Promise.resolve(updated);
  }

  updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) return Promise.reject(new UserNotFoundError());
    this.users.set(id, { ...user, passwordHash, updatedAt: this.clock.now() });
    return Promise.resolve();
  }
}

/** Deterministic and readable: hash("secret") === "hashed:secret". */
export class FakePasswordHasher implements PasswordHasher {
  readonly verified: { plain: string; hash: string | null }[] = [];

  hash(plain: string): Promise<string> {
    return Promise.resolve(`hashed:${plain}`);
  }

  verify(plain: string, hash: string | null): Promise<boolean> {
    this.verified.push({ plain, hash });
    return Promise.resolve(hash === `hashed:${plain}`);
  }
}

export class FakeAccessTokenService implements AccessTokenService {
  sign(userId: string): Promise<AccessToken> {
    return Promise.resolve({ token: `access:${userId}`, expiresIn: 900 });
  }

  verify(token: string): Promise<string | null> {
    return Promise.resolve(
      token.startsWith('access:') ? token.slice('access:'.length) : null,
    );
  }
}

export class FakeSecureTokenGenerator implements SecureTokenGenerator {
  private sequence = 0;

  generate(): string {
    return `token-${++this.sequence}`;
  }

  hash(token: string): string {
    return `sha:${token}`;
  }
}

export class InMemoryRefreshTokenRepository implements RefreshTokenRepository {
  readonly tokens: RefreshTokenRecord[] = [];

  create(token: NewRefreshToken): Promise<RefreshTokenRecord> {
    const record = {
      ...token,
      id: `rt-${this.tokens.length + 1}`,
      revokedAt: null,
    };
    this.tokens.push(record);
    return Promise.resolve(record);
  }

  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return Promise.resolve(
      this.tokens.find((t) => t.tokenHash === tokenHash) ?? null,
    );
  }

  revoke(id: string, at: Date): Promise<boolean> {
    const token = this.tokens.find((t) => t.id === id && t.revokedAt === null);
    if (token) token.revokedAt = at;
    return Promise.resolve(Boolean(token));
  }

  revokeFamily(familyId: string, at: Date): Promise<void> {
    this.revokeWhere((t) => t.familyId === familyId, at);
    return Promise.resolve();
  }

  revokeAllForUser(userId: string, at: Date): Promise<void> {
    this.revokeWhere((t) => t.userId === userId, at);
    return Promise.resolve();
  }

  active(): RefreshTokenRecord[] {
    return this.tokens.filter((t) => t.revokedAt === null);
  }

  private revokeWhere(
    predicate: (t: RefreshTokenRecord) => boolean,
    at: Date,
  ): void {
    for (const token of this.tokens) {
      if (predicate(token) && token.revokedAt === null) token.revokedAt = at;
    }
  }
}

export class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepository {
  readonly tokens: PasswordResetTokenRecord[] = [];

  create(token: NewPasswordResetToken): Promise<PasswordResetTokenRecord> {
    const record = {
      ...token,
      id: `prt-${this.tokens.length + 1}`,
      usedAt: null,
    };
    this.tokens.push(record);
    return Promise.resolve(record);
  }

  findByHash(tokenHash: string): Promise<PasswordResetTokenRecord | null> {
    return Promise.resolve(
      this.tokens.find((t) => t.tokenHash === tokenHash) ?? null,
    );
  }

  markUsed(id: string, at: Date): Promise<boolean> {
    const token = this.tokens.find((t) => t.id === id && t.usedAt === null);
    if (token) token.usedAt = at;
    return Promise.resolve(Boolean(token));
  }

  invalidateAllForUser(userId: string, at: Date): Promise<void> {
    for (const token of this.tokens) {
      if (token.userId === userId && token.usedAt === null) token.usedAt = at;
    }
    return Promise.resolve();
  }
}

export class SpyMailer implements Mailer {
  readonly passwordResets: PasswordResetEmail[] = [];

  sendPasswordReset(email: PasswordResetEmail): Promise<void> {
    this.passwordResets.push(email);
    return Promise.resolve();
  }
}
