export interface EmailChangeTokenRecord {
  id: string;
  userId: string;
  /** Normalised address the account will move to once confirmed. */
  newEmail: string;
  tokenHash: string;
  expiresAt: Date;
}

export type NewEmailChangeToken = Omit<EmailChangeTokenRecord, 'id'>;

/** At most one pending e-mail change per user. */
export interface EmailChangeTokenRepository {
  /** Stores the request, replacing the user's previous one (its link stops working). */
  replaceForUser(token: NewEmailChangeToken): Promise<EmailChangeTokenRecord>;
  findByHash(tokenHash: string): Promise<EmailChangeTokenRecord | null>;
  /** The user's request still valid at `now`, if any. */
  findPendingForUser(
    userId: string,
    now: Date,
  ): Promise<EmailChangeTokenRecord | null>;
  /** Atomically consumes (deletes) the token. Returns false if it was already used. */
  consume(id: string): Promise<boolean>;
  deleteAllForUser(userId: string): Promise<void>;
}

export const EMAIL_CHANGE_TOKEN_REPOSITORY = Symbol(
  'EmailChangeTokenRepository',
);
