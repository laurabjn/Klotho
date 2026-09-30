import { DomainError } from '../shared/domain-error';

/** The imposed piece is not in the user's wardrobe. */
export class ImposedItemNotFoundError extends DomainError {
  readonly code = 'outfits.imposedItemNotFound';
}

/**
 * The imposed piece cannot be worn today: in the wash, lent, archived, sold,
 * given away, or underwear (never part of a look).
 */
export class ImposedItemUnavailableError extends DomainError {
  readonly code = 'outfits.imposedItemUnavailable';
}
