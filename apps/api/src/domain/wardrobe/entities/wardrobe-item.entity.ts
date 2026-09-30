import type {
  ColorKey,
  Pattern,
  Season,
  Style,
  WardrobeCategory,
  WardrobeSort,
  WardrobeStatus,
} from '@klotho/shared';

export interface WardrobeItem {
  id: string;
  userId: string;
  name: string | null;
  category: WardrobeCategory;
  subcategory: string | null;
  primaryColor: ColorKey;
  secondaryColors: ColorKey[];
  pattern: Pattern | null;
  material: string | null;
  styles: Style[];
  seasons: Season[];
  minTemperature: number | null;
  maxTemperature: number | null;
  warmthLevel: number | null;
  formalityLevel: number | null;
  brand: string | null;
  size: string | null;
  status: WardrobeStatus;
  /** Main photo first, then by position. */
  photos: WardrobePhoto[];
  wearCount: number;
  lastWornAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WardrobePhoto {
  id: string;
  itemId: string;
  storageKey: string;
  width: number;
  height: number;
  /** Order of addition; stable, never renumbered. */
  position: number;
  isMain: boolean;
  createdAt: Date;
}

/** An item has exactly one main photo as soon as it has photos. */
export function sortPhotos(photos: WardrobePhoto[]): WardrobePhoto[] {
  return [...photos].sort(
    (a, b) => Number(b.isMain) - Number(a.isMain) || a.position - b.position,
  );
}

/** Fields the owner can set; usage fields are maintained by the app. */
export type WardrobeItemFields = Omit<
  WardrobeItem,
  | 'id'
  | 'userId'
  | 'photos'
  | 'wearCount'
  | 'lastWornAt'
  | 'createdAt'
  | 'updatedAt'
>;

export type WardrobeItemChanges = Partial<WardrobeItemFields>;

export interface WardrobeFilters {
  category?: WardrobeCategory[];
  /** Matches the main colour or any secondary colour. */
  color?: ColorKey[];
  season?: Season[];
  style?: Style[];
  status?: WardrobeStatus[];
  /** Case-insensitive search in name, brand and sub-category. */
  q?: string;
}

export interface WardrobeListQuery {
  filters: WardrobeFilters;
  sort: WardrobeSort;
  page: number;
  pageSize: number;
}

/** A temperature range is meaningful only if min <= max. */
export function hasValidTemperatureRange(
  item: Pick<WardrobeItem, 'minTemperature' | 'maxTemperature'>,
): boolean {
  return (
    item.minTemperature === null ||
    item.maxTemperature === null ||
    item.minTemperature <= item.maxTemperature
  );
}
