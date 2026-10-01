import type { Outfit, WeatherCondition } from '@klotho/shared';
import type { TFunction } from 'i18next';

/** A title in the spirit of the mockups ("Douceur printanière"). */
export function outfitTitle(t: TFunction, outfit: Pick<Outfit, 'occasion'>) {
  return t(`outfits.titles.${outfit.occasion ?? 'default'}`);
}

/** The four weather chips of "Créer une tenue". */
export type WeatherChoice = 'cloudy' | 'clear' | 'rain' | 'snow';
export const WEATHER_CHOICES: WeatherChoice[] = [
  'cloudy',
  'clear',
  'rain',
  'snow',
];

/** Maps the forecast onto the chips (fog is cloudy, a storm is rainy). */
export function weatherChoiceOf(
  condition: WeatherCondition | null,
): WeatherChoice | null {
  switch (condition) {
    case 'clear':
      return 'clear';
    case 'rain':
    case 'storm':
      return 'rain';
    case 'snow':
      return 'snow';
    case 'cloudy':
    case 'fog':
      return 'cloudy';
    default:
      return null;
  }
}
