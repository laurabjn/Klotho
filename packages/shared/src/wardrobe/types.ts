import type {
  ColorKey,
  Pattern,
  Season,
  Style,
  WardrobeCategory,
  WardrobeStatus,
} from './taxonomy';

/** A wardrobe item as returned by the API. */
export interface WardrobeItem {
  id: string;
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
  wearCount: number;
  lastWornAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
