import { DomainError } from '../shared/domain-error';

/** Also raised for items of other users: a neutral 404 reveals nothing. */
export class WardrobeItemNotFoundError extends DomainError {
  readonly code = 'wardrobe.notFound';
}

export class InvalidTemperatureRangeError extends DomainError {
  readonly code = 'wardrobe.invalidTemperatureRange';
}
