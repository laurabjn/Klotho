import { useWindowDimensions } from 'react-native';

/** Width (in dp at a normal text size) below which rows are stacked; the mockups are drawn for 390. */
const COMPACT_WIDTH = 360;

/**
 * True on narrow phones or with a large system text size: layouts that put
 * several columns side by side (as on the mockups) then stack them instead.
 */
export function useCompactLayout(): boolean {
  const { width, fontScale } = useWindowDimensions();
  return width / Math.max(fontScale, 1) < COMPACT_WIDTH;
}
