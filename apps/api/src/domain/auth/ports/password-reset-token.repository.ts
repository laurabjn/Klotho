export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
}

export type NewPasswordResetToken = Omit<
  PasswordResetTokenRecord,
  'id' | 'usedAt'
>;

export interface PasswordResetTokenRepository {
  create(token: NewPasswordResetToken): Promise<PasswordResetTokenRecord>;
  findByHash(tokenHash: string): Promise<PasswordResetTokenRecord | null>;
  /** Atomically consumes an unused token. Returns false if it was already used. */
  markUsed(id: string, at: Date): Promise<boolean>;
  /** Consumes every pending token of the user (a new request or a successful reset). */
  invalidateAllForUser(userId: string, at: Date): Promise<void>;
}

export const PASSWORD_RESET_TOKEN_REPOSITORY = Symbol(
  'PasswordResetTokenRepository',
);
