import * as Sentry from '@sentry/react-native';

/** Set in `.env` (EXPO_PUBLIC_SENTRY_DSN); without it, nothing is sent. */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

/** Keys never sent with an error report. */
const SECRET_KEYS = /authorization|cookie|password|token|secret|email/i;

function scrub<T>(value: T): T {
  if (Array.isArray(value)) return value.map(scrub) as T;
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, inner]) => [
      key,
      SECRET_KEYS.test(key) ? '[redacted]' : scrub(inner),
    ]),
  ) as T;
}

/**
 * Crash reporting (Sentry): crashes and unexpected errors only, with no
 * personal data (no e-mail, no tokens, no request bodies).
 */
export function initMonitoring() {
  if (!dsn) return;
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    enabled: !__DEV__,
    tracesSampleRate: 0,
    beforeSend: (event) => {
      delete event.user;
      if (event.request) {
        delete event.request.cookies;
        delete event.request.data;
        event.request.headers = scrub(event.request.headers);
      }
      if (event.extra) event.extra = scrub(event.extra);
      return event;
    },
    beforeBreadcrumb: (breadcrumb) =>
      breadcrumb.data
        ? { ...breadcrumb, data: scrub(breadcrumb.data) }
        : breadcrumb,
  });
}

/** Reports an error the app caught but did not expect. */
export function reportError(error: unknown) {
  if (dsn) Sentry.captureException(error);
}

export const wrapRoot = Sentry.wrap;
