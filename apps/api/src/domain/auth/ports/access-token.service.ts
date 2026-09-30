export interface AccessToken {
  token: string;
  /** Lifetime in seconds. */
  expiresIn: number;
}

export interface AccessTokenService {
  sign(userId: string): Promise<AccessToken>;
  /** Returns the user id, or null when the token is invalid or expired. */
  verify(token: string): Promise<string | null>;
}

export const ACCESS_TOKEN_SERVICE = Symbol('AccessTokenService');
