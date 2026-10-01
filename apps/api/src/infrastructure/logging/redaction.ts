// Keeps secrets out of the logs: credentials, tokens, signed URLs, cookies.

export const REDACTED = '[REDACTED]';

/** Property names whose value is never logged (case-insensitive, substring). */
const SENSITIVE_KEY =
  /pass(word|wd)?|token|secret|authori[sz]ation|cookie|signature|api[-_]?key|appid|credential|resetUrl/i;

const TEXT_RULES: [RegExp, string][] = [
  // Authorization header values.
  [/\b(Bearer|Basic)\s+[\w.~+/=-]+/gi, `$1 ${REDACTED}`],
  // JWTs wherever they appear.
  [/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, REDACTED],
  // Query parameters carrying secrets (signed URLs, reset links, API keys).
  [
    /([?&](?:X-Amz-[\w-]+|token|access_token|refresh_token|appid|api_key|apikey|signature|sig)=)[^&\s"']*/gi,
    `$1${REDACTED}`,
  ],
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

export function redactText(text: string): string {
  return TEXT_RULES.reduce(
    (result, [pattern, replacement]) => result.replace(pattern, replacement),
    text,
  );
}

/**
 * A copy of `value` safe to log: sensitive properties are masked at any
 * depth and strings are scrubbed. Errors keep their name and a scrubbed
 * message and stack.
 */
export function redact(value: unknown, depth = 0): unknown {
  if (typeof value === 'string') return redactText(value);
  if (value === null || typeof value !== 'object') return value;
  if (depth > 8) return '[Truncated]';
  if (value instanceof Error) {
    const copy = new Error(redactText(value.message));
    copy.name = value.name;
    copy.stack = value.stack && redactText(value.stack);
    return copy;
  }
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      isSensitiveKey(key) ? REDACTED : redact(item, depth + 1),
    ]),
  );
}
