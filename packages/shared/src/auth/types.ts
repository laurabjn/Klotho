/** Public view of a user: never contains the password hash. */
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  bio: string | null;
  /** Signed link to the profile photo (expires), or null. */
  avatarUrl: string | null;
  /** New address waiting for its confirmation link, if any. */
  pendingEmail: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  /** Lifetime of the access token, in seconds. */
  accessTokenExpiresIn: number;
  refreshToken: string;
}

export interface AuthSession {
  user: UserProfile;
  tokens: AuthTokens;
}

/** Body of every API error response. */
export interface ApiErrorBody {
  statusCode: number;
  /** Stable machine-readable code, also used as i18n key on mobile. */
  code: string;
  issues?: { path: string; message: string }[];
}
