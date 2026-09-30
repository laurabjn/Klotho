export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  /** Every token obtained by rotating the same login shares a family. */
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
}

export type NewRefreshToken = Omit<RefreshTokenRecord, 'id' | 'revokedAt'>;

export interface RefreshTokenRepository {
  create(token: NewRefreshToken): Promise<RefreshTokenRecord>;
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  /** Atomically revokes an active token. Returns false if it was already revoked. */
  revoke(id: string, at: Date): Promise<boolean>;
  revokeFamily(familyId: string, at: Date): Promise<void>;
  revokeAllForUser(userId: string, at: Date): Promise<void>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol('RefreshTokenRepository');
