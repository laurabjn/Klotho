import { styleProfileSchema } from './schemas';

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('styleProfileSchema', () => {
  it('accepts an empty profile ("Passer pour l\'instant")', () => {
    expect(styleProfileSchema.parse({})).toEqual({
      preferredStyles: [],
      preferredColors: [],
      avoidedColors: [],
      facePreferredColors: [],
      colorSeason: null,
      preferredMetals: [],
      acceptsHeels: null,
      preferredBottoms: [],
      preferredFormality: null,
      minLength: null,
      avoidsDeepNeckline: null,
    });
  });

  it('accepts a complete profile', () => {
    const profile = {
      preferredStyles: ['romantic', 'vintage'],
      preferredColors: ['powderPink', 'ecru'],
      avoidedColors: ['black'],
      facePreferredColors: ['oldRose'],
      colorSeason: 'spring',
      preferredMetals: ['gold', 'roseGold'],
      acceptsHeels: false,
      preferredBottoms: ['skirts', 'dresses'],
      preferredFormality: 3,
      minLength: 'knee',
      avoidsDeepNeckline: true,
    };
    expect(styleProfileSchema.parse(profile)).toEqual(profile);
  });

  it.each([
    [{ preferredStyles: ['gothic'] }, 'errors.wardrobe.style'],
    [{ preferredColors: ['neonGreen'] }, 'errors.wardrobe.color'],
    [{ preferredMetals: ['platinum'] }, 'errors.preferences.metal'],
    [{ preferredBottoms: ['kilts'] }, 'errors.preferences.bottoms'],
    [{ preferredFormality: 6 }, 'errors.wardrobe.level'],
    [{ minLength: 'ankle' }, 'errors.preferences.length'],
    [{ colorSeason: 'monsoon' }, 'errors.wardrobe.season'],
  ])('rejects %j', (input, expected) => {
    expect(messages(styleProfileSchema.safeParse(input))).toContain(expected);
  });

  it('refuses a colour both preferred and avoided', () => {
    const result = styleProfileSchema.safeParse({
      preferredColors: ['black', 'ecru'],
      avoidedColors: ['black'],
    });
    expect(result.error?.issues[0]).toMatchObject({
      path: ['avoidedColors'],
      message: 'errors.preferences.colorConflict',
    });
  });

  it('removes duplicates', () => {
    expect(
      styleProfileSchema.parse({ preferredStyles: ['chic', 'chic'] })
        .preferredStyles,
    ).toEqual(['chic']);
  });
});
