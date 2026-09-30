import type { City } from '@klotho/shared';

/** Finds cities by name, for users who do not share their position. */
export interface CityGeocoder {
  search(query: string, language: 'fr' | 'en'): Promise<City[]>;
}

export const CITY_GEOCODER = Symbol('CityGeocoder');
