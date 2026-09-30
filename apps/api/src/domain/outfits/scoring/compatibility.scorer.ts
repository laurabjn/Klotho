import { mainPieces, type Outfit } from '../entities/outfit-candidate';

/** By spread between the most and the least formal piece (0 to 4). */
const BY_FORMALITY_SPREAD = [1, 1, 0.7, 0.4, 0.1];

/**
 * Overall coherence of the pieces with each other: similar formality, and
 * at least one style they share.
 */
export function scoreCompatibility(outfit: Outfit): number {
  const pieces = mainPieces(outfit).map((piece) => piece.item);

  const levels = pieces
    .map((item) => item.formalityLevel)
    .filter((level): level is number => level !== null);
  const formality =
    levels.length < 2
      ? 0.75
      : BY_FORMALITY_SPREAD[Math.max(...levels) - Math.min(...levels)]!;

  const styled = pieces.filter((item) => item.styles.length > 0);
  let styleCohesion = 0.5;
  if (styled.length >= 2) {
    const [first, ...others] = styled;
    const shared = first!.styles.some((style) =>
      others.every((item) => item.styles.includes(style)),
    );
    const pairsSharing = styled.filter((item) =>
      styled.some(
        (other) =>
          other !== item && other.styles.some((s) => item.styles.includes(s)),
      ),
    ).length;
    styleCohesion = shared ? 1 : 0.3 + 0.5 * (pairsSharing / styled.length);
  }
  return 0.6 * formality + 0.4 * styleCohesion;
}
