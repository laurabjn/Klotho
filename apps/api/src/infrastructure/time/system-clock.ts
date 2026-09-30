import type { Clock } from '../../domain/shared/ports/clock';

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
