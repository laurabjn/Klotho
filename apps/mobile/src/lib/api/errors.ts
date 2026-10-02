import type { ApiErrorBody } from '@klotho/shared';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly issues: ApiErrorBody['issues'] = [],
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(cause?: unknown) {
    super('network', { cause });
    this.name = 'NetworkError';
  }
}

const KNOWN_CODES = new Set([
  'auth.emailAlreadyUsed',
  'auth.invalidCredentials',
  'auth.invalidRefreshToken',
  'auth.invalidResetToken',
  'auth.unauthorized',
  'validation.failed',
  'request.tooMany',
  'request.rateLimited',
  'users.invalidPassword',
  'users.invalidAvatar',
  'users.sameEmail',
  'auth.invalidEmailToken',
  'uploads.invalidImage',
  'uploads.tooLarge',
  'uploads.notFound',
  'uploads.missingFile',
  'wardrobe.notFound',
  'wardrobe.photoNotFound',
  'wardrobe.photoLimitReached',
  'wardrobe.invalidTemperatureRange',
  'weather.unavailable',
  'weather.locationMissing',
  'outfits.notFound',
  'outfits.noOutfitPossible',
  'outfits.invalidReplacement',
  'outfits.imposedItemNotFound',
  'outfits.imposedItemUnavailable',
  'outfits.wearNotFound',
  'outfits.worn',
  'plans.notFound',
  'plans.pastDay',
]);

/** i18n key of the message to show for any error thrown by the API client. */
export function errorMessageKey(error: unknown): string {
  if (error instanceof NetworkError) return 'apiErrors.network';
  if (error instanceof ApiError && KNOWN_CODES.has(error.code))
    return `apiErrors.${error.code}`;
  return 'apiErrors.unknown';
}
