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

export class OutfitNotFoundError extends DomainError {
  readonly code = 'outfits.notFound';
}

/** Also raised for another user's wear. */
export class OutfitWearNotFoundError extends DomainError {
  readonly code = 'outfits.wearNotFound';
}

/** Not enough suitable pieces to build a look (e.g. only sandals at 4 °C). */
export class NoOutfitPossibleError extends DomainError {
  readonly code = 'outfits.noOutfitPossible';
}

/** The replacement is not a piece of the right kind, or cannot be worn. */
export class InvalidReplacementError extends DomainError {
  readonly code = 'outfits.invalidReplacement';
}
