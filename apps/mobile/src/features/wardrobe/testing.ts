import type { Page, WardrobeItem } from '@klotho/shared';

let sequence = 0;

export function wardrobeItem(
  overrides: Partial<WardrobeItem> = {},
): WardrobeItem {
  sequence += 1;
  return {
    id: `item-${sequence}`,
    name: null,
    category: 'TOP',
    subcategory: null,
    primaryColor: 'powderPink',
    secondaryColors: [],
    pattern: null,
    material: null,
    styles: [],
    seasons: [],
    minTemperature: null,
    maxTemperature: null,
    warmthLevel: null,
    formalityLevel: null,
    brand: null,
    size: null,
    status: 'AVAILABLE',
    wearCount: 0,
    lastWornAt: null,
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-01T08:00:00.000Z',
    ...overrides,
  };
}

export function page(
  items: WardrobeItem[],
  overrides: Partial<Page<WardrobeItem>> = {},
) {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 24,
    hasMore: false,
    ...overrides,
  };
}
