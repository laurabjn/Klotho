import { analyzePhotoQuerySchema, garmentSuggestionSchema } from './schemas';

const blouse = {
  name: 'Blouse romantique',
  category: 'TOP',
  subcategory: 'blouse',
  primaryColor: 'white',
  secondaryColors: ['powderPink'],
  pattern: 'plain',
  material: 'Coton',
  styles: ['romantic', 'boho'],
  seasons: ['spring', 'summer'],
  minTemperature: 16,
  maxTemperature: 28,
  warmthLevel: 2,
  formalityLevel: 3,
};

describe('garmentSuggestionSchema', () => {
  it('keeps a valid answer as is', () => {
    expect(garmentSuggestionSchema.parse(blouse)).toEqual(blouse);
  });

  it('drops the unknown values one by one', () => {
    expect(
      garmentSuggestionSchema.parse({
        ...blouse,
        category: 'HAT',
        primaryColor: 'sparkly',
        styles: ['romantic', 'gothic', 'romantic'],
        seasons: 'all year',
        warmthLevel: 9,
      }),
    ).toMatchObject({
      // The sub-category tells the real one.
      category: 'TOP',
      subcategory: 'blouse',
      primaryColor: null,
      styles: ['romantic'],
      seasons: [],
      warmthLevel: null,
    });
  });

  it('finds the category from a known sub-category', () => {
    expect(
      garmentSuggestionSchema.parse({ subcategory: 'blouse' }),
    ).toMatchObject({ category: 'TOP', subcategory: 'blouse' });
  });

  it('only keeps a sub-category of the category', () => {
    expect(
      garmentSuggestionSchema.parse({ ...blouse, subcategory: 'jeans' })
        .subcategory,
    ).toBeNull();
  });

  it('does not repeat the main colour among the others', () => {
    expect(
      garmentSuggestionSchema.parse({
        ...blouse,
        secondaryColors: ['white', 'sand'],
      }).secondaryColors,
    ).toEqual(['sand']);
  });

  it('forgets a reversed temperature range', () => {
    expect(
      garmentSuggestionSchema.parse({
        ...blouse,
        minTemperature: 25,
        maxTemperature: 10,
      }),
    ).toMatchObject({ minTemperature: null, maxTemperature: null });
  });

  it('turns missing fields into nothing proposed', () => {
    expect(garmentSuggestionSchema.parse({})).toEqual({
      name: null,
      category: null,
      subcategory: null,
      primaryColor: null,
      secondaryColors: [],
      pattern: null,
      material: null,
      styles: [],
      seasons: [],
      minTemperature: null,
      maxTemperature: null,
      warmthLevel: null,
      formalityLevel: null,
    });
  });

  it('shortens a long name and empties a blank one', () => {
    const parsed = garmentSuggestionSchema.parse({
      name: 'x'.repeat(80),
      material: '  ',
    });
    expect(parsed.name).toHaveLength(60);
    expect(parsed.material).toBeNull();
  });
});

describe('analyzePhotoQuerySchema', () => {
  it('proposes French names by default', () => {
    expect(analyzePhotoQuerySchema.parse({})).toEqual({ language: 'fr' });
    expect(analyzePhotoQuerySchema.safeParse({ language: 'de' }).success).toBe(
      false,
    );
  });
});
