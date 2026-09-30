import {
  createWardrobeItemSchema,
  listWardrobeQuerySchema,
  updateWardrobeItemSchema,
} from './schemas';
import {
  COLORS,
  COLOR_FAMILIES,
  COLOR_KEYS,
  SUBCATEGORIES,
  WARDROBE_CATEGORIES,
} from './taxonomy';

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const minimal = { category: 'TOP', primaryColor: 'powderPink' };

describe('taxonomy', () => {
  it('gives every colour a hex value', () => {
    for (const key of COLOR_KEYS) expect(COLORS[key]).toMatch(/^#[0-9A-F]{6}$/);
  });

  it('puts every colour in exactly one family', () => {
    const grouped = Object.values(COLOR_FAMILIES).flatMap(Object.keys);
    expect(grouped).toHaveLength(COLOR_KEYS.length);
    expect(new Set(grouped)).toEqual(new Set(COLOR_KEYS));
  });

  it('keeps the colours already stored on items', () => {
    for (const key of ['softYellow', 'lemon', 'navy', 'gold'])
      expect(COLOR_KEYS).toContain(key);
  });

  it('suggests sub-categories for every category', () => {
    for (const category of WARDROBE_CATEGORIES) {
      expect(SUBCATEGORIES[category].length).toBeGreaterThan(0);
    }
  });
});

describe('createWardrobeItemSchema', () => {
  it('only requires a category and a main colour', () => {
    expect(createWardrobeItemSchema.parse(minimal)).toEqual({
      ...minimal,
      secondaryColors: [],
      styles: [],
      seasons: [],
      status: 'AVAILABLE',
    });
  });

  it.each([
    [{ primaryColor: 'black' }, 'errors.wardrobe.category'],
    [{ category: 'TOP' }, 'errors.wardrobe.color'],
    [{ ...minimal, category: 'HAT' }, 'errors.wardrobe.category'],
    [{ ...minimal, primaryColor: 'neonGreen' }, 'errors.wardrobe.color'],
    [{ ...minimal, styles: ['gothic'] }, 'errors.wardrobe.style'],
    [{ ...minimal, seasons: ['monsoon'] }, 'errors.wardrobe.season'],
    [{ ...minimal, status: 'LOST' }, 'errors.wardrobe.status'],
    [{ ...minimal, warmthLevel: 6 }, 'errors.wardrobe.level'],
    [{ ...minimal, formalityLevel: 0 }, 'errors.wardrobe.level'],
    [{ ...minimal, minTemperature: -40 }, 'errors.wardrobe.temperature'],
  ])('rejects %j', (input, expected) => {
    expect(messages(createWardrobeItemSchema.safeParse(input))).toContain(
      expected,
    );
  });

  it('requires min temperature <= max temperature', () => {
    const result = createWardrobeItemSchema.safeParse({
      ...minimal,
      minTemperature: 20,
      maxTemperature: 10,
    });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['maxTemperature'],
      message: 'errors.wardrobe.temperatureRange',
    });
  });

  it('trims texts and turns empty ones into null', () => {
    const item = createWardrobeItemSchema.parse({
      ...minimal,
      name: '  Blouse ',
      brand: '   ',
    });
    expect(item.name).toBe('Blouse');
    expect(item.brand).toBeNull();
  });

  it('removes duplicate list entries', () => {
    const item = createWardrobeItemSchema.parse({
      ...minimal,
      styles: ['chic', 'romantic', 'chic'],
    });
    expect(item.styles).toEqual(['chic', 'romantic']);
  });
});

describe('updateWardrobeItemSchema', () => {
  it('accepts a partial update without applying defaults', () => {
    expect(updateWardrobeItemSchema.parse({ status: 'WASHING' })).toEqual({
      status: 'WASHING',
    });
  });

  it('still validates enums', () => {
    expect(
      messages(updateWardrobeItemSchema.safeParse({ status: 'LOST' })),
    ).toContain('errors.wardrobe.status');
  });
});

describe('listWardrobeQuerySchema', () => {
  it('applies pagination and sort defaults', () => {
    expect(listWardrobeQuerySchema.parse({})).toEqual({
      page: 1,
      pageSize: 24,
      sort: 'recent',
    });
  });

  it('parses comma-separated filters from the query string', () => {
    expect(
      listWardrobeQuerySchema.parse({
        page: '2',
        category: 'TOP,BOTTOM',
        status: 'AVAILABLE',
      }),
    ).toMatchObject({
      page: 2,
      category: ['TOP', 'BOTTOM'],
      status: ['AVAILABLE'],
    });
  });

  it('rejects an unknown filter value', () => {
    expect(
      listWardrobeQuerySchema.safeParse({ category: 'TOP,HAT' }).success,
    ).toBe(false);
  });

  it('caps the page size', () => {
    expect(listWardrobeQuerySchema.safeParse({ pageSize: '500' }).success).toBe(
      false,
    );
  });
});
