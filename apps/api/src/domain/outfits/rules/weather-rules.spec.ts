import { context, piece } from '../../../testing/outfit-fakes';
import {
  comfortRange,
  isForbiddenByWeather,
  pieceWeatherFit,
  seasonOf,
  temperatureFit,
} from './weather-rules';

describe('comfortRange', () => {
  it('uses the range given by the user first', () => {
    expect(
      comfortRange(
        piece({
          category: 'TOP',
          minTemperature: 5,
          maxTemperature: 15,
          warmthLevel: 1,
        }),
      ),
    ).toEqual([5, 15]);
    expect(
      comfortRange(piece({ category: 'TOP', minTemperature: 10 })),
    ).toEqual([10, Infinity]);
  });

  it('then the warmth level, then the sub-category', () => {
    expect(comfortRange(piece({ category: 'LAYER', warmthLevel: 5 }))).toEqual([
      -30, 8,
    ]);
    expect(
      comfortRange(piece({ category: 'SHOES', subcategory: 'sandals' })),
    ).toEqual([20, 50]);
    expect(
      comfortRange(piece({ category: 'TOP', subcategory: 'blouse' })),
    ).toBeNull();
  });
});

describe('temperatureFit', () => {
  const sandals = piece({ category: 'SHOES', subcategory: 'sandals' });

  it('is 1 inside the range or when nothing is known', () => {
    expect(temperatureFit(sandals, 25)).toBe(1);
    expect(temperatureFit(sandals, null)).toBe(1);
    expect(temperatureFit(piece({ category: 'TOP' }), -10)).toBe(1);
  });

  it('decreases up to the tolerance, then excludes the piece', () => {
    expect(temperatureFit(sandals, 19)).toBeCloseTo(1 - 0.7 / 3);
    expect(temperatureFit(sandals, 17)).toBeCloseTo(0.3);
    expect(temperatureFit(sandals, 16)).toBe(0);
  });
});

describe('weather', () => {
  it('knows the season of a date', () => {
    expect(seasonOf(new Date('2026-01-15'))).toBe('winter');
    expect(seasonOf(new Date('2026-04-15'))).toBe('spring');
    expect(seasonOf(new Date('2026-07-15'))).toBe('summer');
    expect(seasonOf(new Date('2026-10-15'))).toBe('autumn');
  });

  it('prefers pieces of the season', () => {
    const summer = piece({ category: 'DRESS', seasons: ['summer'] });
    const autumn = piece({ category: 'DRESS', seasons: ['autumn', 'winter'] });

    expect(pieceWeatherFit(autumn, context())).toBe(1);
    expect(pieceWeatherFit(summer, context())).toBeCloseTo(0.6);
  });

  it('keeps open shoes out of the rain and sandals out of the snow', () => {
    const flats = piece({ category: 'SHOES', subcategory: 'flats' });
    const boots = piece({ category: 'SHOES', subcategory: 'ankleBoots' });
    const rain = context({ condition: 'rain', precipitation: 2 });

    expect(pieceWeatherFit(flats, rain)).toBeCloseTo(0.5);
    expect(pieceWeatherFit(boots, rain)).toBe(1);
    expect(
      isForbiddenByWeather(
        piece({ category: 'SHOES', subcategory: 'sandals' }),
        context({ condition: 'snow' }),
      ),
    ).toBe(true);
  });

  it('is careful with short pieces in strong wind', () => {
    const shortSkirt = piece({ category: 'BOTTOM', subcategory: 'shortSkirt' });

    expect(pieceWeatherFit(shortSkirt, context({ windSpeed: 50 }))).toBeCloseTo(
      0.7,
    );
  });
});
