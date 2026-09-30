import { DomainError } from '../shared/domain-error';

/** The weather service did not answer in time, or failed. */
export class WeatherUnavailableError extends DomainError {
  readonly code = 'weather.unavailable';
}

/** No position was sent and no city is saved. */
export class WeatherLocationMissingError extends DomainError {
  readonly code = 'weather.locationMissing';
}
