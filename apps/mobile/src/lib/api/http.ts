import type { ApiErrorBody } from '@klotho/shared';

import { resolveApiUrl } from './config';
import { ApiError, NetworkError } from './errors';
import { watchSlowAnswer } from './server-wake';

/**
 * Long enough for the free server to wake up (about a minute after a while
 * without visits); a lost connection still fails at once.
 */
const TIMEOUT_MS = 90_000;
/** Photo uploads can be slow on mobile networks. */
const UPLOAD_TIMEOUT_MS = 120_000;

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Multipart body (file upload); takes precedence over `body`. */
  form?: FormData;
  /** Sends the access token and transparently refreshes it once on 401. */
  auth?: boolean;
}

/** Hooks provided by the auth session, so this module does not depend on it. */
export interface AuthHooks {
  getAccessToken(): string | null;
  /** Returns a fresh access token, or null when the session is over. */
  refreshAccessToken(): Promise<string | null>;
}

let authHooks: AuthHooks | null = null;

export function registerAuthHooks(hooks: AuthHooks | null): void {
  authHooks = hooks;
}

async function send(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
) {
  const headers: Record<string, string> = { Accept: 'application/json' };
  // For FormData, fetch sets the multipart Content-Type with its boundary.
  if (!options.form && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const controller = new AbortController();
  // Photo uploads show their own progress.
  const answered = options.form ? () => undefined : watchSlowAnswer();
  const timeout = setTimeout(
    () => controller.abort(),
    options.form ? UPLOAD_TIMEOUT_MS : TIMEOUT_MS,
  );
  try {
    return await fetch(`${resolveApiUrl()}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.form ??
        (options.body === undefined ? undefined : JSON.stringify(options.body)),
      signal: controller.signal,
    });
  } catch (error) {
    throw new NetworkError(error);
  } finally {
    clearTimeout(timeout);
    answered();
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as Partial<ApiErrorBody>;
    return new ApiError(
      response.status,
      body.code ?? 'request.failed',
      body.issues,
    );
  } catch {
    return new ApiError(response.status, 'request.failed');
  }
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.auth ? (authHooks?.getAccessToken() ?? null) : null;
  let response = await send(path, options, token);

  if (response.status === 401 && options.auth && authHooks) {
    const refreshed = await authHooks.refreshAccessToken();
    if (refreshed) response = await send(path, options, refreshed);
  }

  if (!response.ok) throw await toApiError(response);
  if (response.status === 204 || response.status === 202) return undefined as T;
  return (await response.json()) as T;
}
