import type {
  ColorKey,
  Pattern,
  Season,
  Style,
  WardrobeCategory,
  WardrobeStatus,
} from './taxonomy';

/** A photo of an item. The URL is signed and expires (about 1 hour). */
export interface WardrobePhoto {
  id: string;
  url: string;
  width: number;
  height: number;
  isMain: boolean;
}

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
  /** Main photo first, then in the order they were added. */
  photos: WardrobePhoto[];
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

/** Result of POST /uploads/wardrobe, to attach with POST /wardrobe/:id/photos. */
export interface UploadedPhoto {
  key: string;
  width: number;
  height: number;
}
