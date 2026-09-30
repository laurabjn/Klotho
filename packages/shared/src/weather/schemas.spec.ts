import {
  citySearchQuerySchema,
  currentWeatherQuerySchema,
  displayTemperature,
  toCelsius,
  weatherSettingsSchema,
} from './schemas';

const messages = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

const lyon = {
  name: 'Lyon',
  country: 'fr',
  latitude: 45.76,
  longitude: 4.84,
};

describe('weatherSettingsSchema', () => {
  it('defaults to nothing set up, in °C', () => {
    expect(weatherSettingsSchema.parse({})).toEqual({
      locationMode: null,
      city: null,
      temperatureUnit: 'celsius',
    });
  });

  it('accepts a saved city and normalises its country code', () => {
    expect(
      weatherSettingsSchema.parse({
        locationMode: 'city',
        city: lyon,
        temperatureUnit: 'fahrenheit',
      }),
    ).toEqual({
      locationMode: 'city',
      city: { ...lyon, country: 'FR', region: null },
      temperatureUnit: 'fahrenheit',
    });
  });

  it('requires a city in "city" mode, not in "device" mode', () => {
    expect(
      messages(weatherSettingsSchema.safeParse({ locationMode: 'city' })),
    ).toContain('errors.weather.cityRequired');
    expect(
      weatherSettingsSchema.safeParse({ locationMode: 'device' }).success,
    ).toBe(true);
  });

  it.each([
    [{ locationMode: 'gps' }, 'errors.weather.locationMode'],
    [{ temperatureUnit: 'kelvin' }, 'errors.weather.unit'],
    [
      { locationMode: 'city', city: { ...lyon, latitude: 120 } },
      'errors.weather.coordinates',
    ],
  ])('rejects %j', (input, expected) => {
    expect(messages(weatherSettingsSchema.safeParse(input))).toContain(
      expected,
    );
  });
});

describe('currentWeatherQuerySchema', () => {
  it('reads coordinates from the query string', () => {
    expect(
      currentWeatherQuerySchema.parse({ latitude: '45.76', longitude: '4.84' }),
    ).toEqual({ latitude: 45.76, longitude: 4.84 });
  });

  it('accepts no coordinates (saved city)', () => {
    expect(currentWeatherQuerySchema.parse({})).toEqual({});
  });

  it.each([
    [{ latitude: '45.76' }],
    [{ latitude: '91', longitude: '0' }],
    [{ latitude: 'abc', longitude: '0' }],
  ])('rejects %j', (input) => {
    expect(currentWeatherQuerySchema.safeParse(input).success).toBe(false);
  });
});

describe('citySearchQuerySchema', () => {
  it('trims the query and defaults to French', () => {
    expect(citySearchQuerySchema.parse({ q: '  Lyon ' })).toEqual({
      q: 'Lyon',
      lang: 'fr',
    });
  });

  it('needs at least two letters', () => {
    expect(messages(citySearchQuerySchema.safeParse({ q: 'L' }))).toContain(
      'errors.weather.query',
    );
  });
});

describe('temperatures', () => {
  it('are shown rounded in the chosen unit', () => {
    expect(displayTemperature(12.6, 'celsius')).toBe(13);
    expect(displayTemperature(12.6, 'fahrenheit')).toBe(55);
    expect(displayTemperature(-3.4, 'celsius')).toBe(-3);
  });

  it('convert back from °F', () => {
    expect(toCelsius(50)).toBeCloseTo(10);
  });
});
