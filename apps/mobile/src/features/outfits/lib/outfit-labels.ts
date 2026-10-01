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

/** "Une tenue romantique pour le quotidien, parfaite pour une journée nuageuse à 17 °C." */
export function outfitSummary(t: TFunction, outfit: Outfit) {
  const condition = weatherChoiceOf(outfit.condition);
  const start = outfit.style
    ? t('outfits.details.summary.style', {
        style: t(`wardrobe.styles.${outfit.style}`).toLowerCase(),
      })
    : t('outfits.details.summary.plain');
  const occasion = outfit.occasion
    ? t('outfits.details.summary.occasion', {
        occasion: t(`outfits.details.forOccasion.${outfit.occasion}`),
      })
    : '';
  const weather = !condition
    ? t('outfits.details.summary.end')
    : outfit.temperature !== null
      ? t('outfits.details.summary.weather', {
          weather: t(`outfits.details.weatherPhrase.${condition}`),
          temperature: outfit.temperature,
        })
      : t('outfits.details.summary.weatherOnly', {
          weather: t(`outfits.details.weatherPhrase.${condition}`),
        });
  return start + occasion + weather;
}

/** Icon of the weather a look was made for (the four chips' icons). */
export const WEATHER_ICONS: Record<
  WeatherChoice,
  'weather-cloudy' | 'weather-sunny' | 'weather-rainy' | 'weather-snowy'
> = {
  cloudy: 'weather-cloudy',
  clear: 'weather-sunny',
  rain: 'weather-rainy',
  snow: 'weather-snowy',
};

/** "17°C • Nuageux", or what is known of it. */
export function weatherLine(t: TFunction, outfit: Outfit): string | null {
  const choice = weatherChoiceOf(outfit.condition);
  const parts = [
    outfit.temperature !== null ? `${outfit.temperature}°C` : null,
    choice ? t(`outfits.conditions.${choice}`) : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' • ') : null;
}
