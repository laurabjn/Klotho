import { ConsoleLogger, type LogLevel } from '@nestjs/common';

import { redact, redactText } from './redaction';

export type LogFormat = 'json' | 'pretty';

/**
 * Nest's console logger, as one JSON object per line in production (for the
 * log collector) or readable text in development. Every message, structured
 * field and stack trace goes through the redaction first.
 */
export class AppLogger extends ConsoleLogger {
  constructor(format: LogFormat) {
    super(
      format === 'json'
        ? { json: true, colors: false, compact: true, flattenParams: true }
        : {},
    );
  }

  protected override printMessages(
    messages: unknown[],
    context?: string,
    logLevel?: LogLevel,
    writeStreamType?: 'stdout' | 'stderr',
    errorStack?: unknown,
    params?: Record<string, unknown>,
  ): void {
    super.printMessages(
      messages.map((message) => redact(message)),
      context,
      logLevel,
      writeStreamType,
      typeof errorStack === 'string' ? redactText(errorStack) : errorStack,
      params && (redact(params) as Record<string, unknown>),
    );
  }

  protected override printStackTrace(stack: string): void {
    super.printStackTrace(stack && redactText(stack));
  }
}
