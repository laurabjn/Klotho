import type {
  ApiErrorBody,
  AuthSession,
  CurrentWeather,
  WeatherSettings,
} from '@klotho/shared';
import request from 'supertest';

import { LYON } from '../src/testing/weather-fakes';
import { createTestApp, type TestApp } from './utils/test-app';

describe('Weather (e2e)', () => {
  let t: TestApp;
  let laura: string;
  let other: string;
  const http = () => request(t.app.getHttpServer());
  const as = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function tokenFor(email: string): Promise<string> {
    const res = await http()
      .post('/auth/register')
      .send({ email, password: 'Dressing2026!', firstName: 'Test' })
      .expect(201);
    return (res.body as AuthSession).tokens.accessToken;
  }

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
    laura = await tokenFor('laura@example.com');
    other = await tokenFor('other@example.com');
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('requires authentication', async () => {
    await http().get('/weather/current').expect(401);
    await http().get('/weather/settings').expect(401);
    await http().put('/weather/settings').send({}).expect(401);
    await http().get('/weather/cities?q=Lyon').expect(401);
  });

  describe('GET /weather/current', () => {
    it('gives the weather at the phone position, rounded', async () => {
      const res = await http()
        .get('/weather/current?latitude=45.764043&longitude=4.835659')
        .set(as(laura))
        .expect(200);

      expect(res.body).toEqual({
        temperature: 18.4,
        feelsLike: 17.2,
        condition: 'clear',
        precipitation: 0,
        windSpeed: 11.2,
        locationName: 'Lyon',
        observedAt: '2026-10-01T08:00:00.000Z',
        source: 'device',
      });
      expect(t.weather.calls).toEqual([{ latitude: 45.76, longitude: 4.84 }]);
    });

    it('uses the saved city when no position is sent', async () => {
      await http()
        .put('/weather/settings')
        .set(as(laura))
        .send({ locationMode: 'city', city: LYON })
        .expect(200);

      const res = await http()
        .get('/weather/current')
        .set(as(laura))
        .expect(200);
      expect((res.body as CurrentWeather).source).toBe('city');

      // Another user has no city saved.
      const missing = await http()
        .get('/weather/current')
        .set(as(other))
        .expect(422);
      expect((missing.body as ApiErrorBody).code).toBe(
        'weather.locationMissing',
      );
    });

    it('rejects invalid coordinates', async () => {
      await http()
        .get('/weather/current?latitude=100&longitude=4')
        .set(as(laura))
        .expect(400);
      await http()
        .get('/weather/current?latitude=45')
        .set(as(laura))
        .expect(400);
    });

    it('answers 503 when the weather service fails', async () => {
      t.weather.failing = true;

      const res = await http()
        .get('/weather/current?latitude=45.76&longitude=4.84')
        .set(as(laura))
        .expect(503);
      expect((res.body as ApiErrorBody).code).toBe('weather.unavailable');
    });
  });

  describe('/weather/settings', () => {
    it('are not set up, in °C, for a new account', async () => {
      const res = await http()
        .get('/weather/settings')
        .set(as(laura))
        .expect(200);

      expect(res.body).toEqual({
        locationMode: null,
        city: null,
        temperatureUnit: 'celsius',
      });
    });

    it('are saved and kept private', async () => {
      const saved = {
        locationMode: 'device',
        city: LYON,
        temperatureUnit: 'fahrenheit',
      };
      await http()
        .put('/weather/settings')
        .set(as(laura))
        .send(saved)
        .expect(200, saved);

      await http().get('/weather/settings').set(as(laura)).expect(200, saved);
      const theirs = await http()
        .get('/weather/settings')
        .set(as(other))
        .expect(200);
      expect((theirs.body as WeatherSettings).city).toBeNull();
    });

    it('can forget the city', async () => {
      await http()
        .put('/weather/settings')
        .set(as(laura))
        .send({ locationMode: 'city', city: LYON })
        .expect(200);
      await http()
        .put('/weather/settings')
        .set(as(laura))
        .send({ locationMode: 'device' })
        .expect(200);

      const res = await http()
        .get('/weather/settings')
        .set(as(laura))
        .expect(200);
      expect((res.body as WeatherSettings).city).toBeNull();
    });

    it('refuses the city mode without a city', async () => {
      const res = await http()
        .put('/weather/settings')
        .set(as(laura))
        .send({ locationMode: 'city' })
        .expect(400);

      expect((res.body as ApiErrorBody).issues).toContainEqual({
        path: 'city',
        message: 'errors.weather.cityRequired',
      });
    });
  });

  describe('GET /weather/cities', () => {
    it('finds cities by name', async () => {
      await http()
        .get('/weather/cities?q=ly')
        .set(as(laura))
        .expect(200, [LYON]);
    });

    it('needs at least two letters', async () => {
      await http().get('/weather/cities?q=l').set(as(laura)).expect(400);
    });
  });
});
