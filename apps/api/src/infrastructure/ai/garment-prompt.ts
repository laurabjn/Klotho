// What any AI provider is asked about a photo, and the shape of its answer.
import {
  COLOR_KEYS,
  LEVEL_MAX,
  LEVEL_MIN,
  PATTERNS,
  SEASONS,
  STYLES,
  SUBCATEGORIES,
  TEMPERATURE_MAX,
  TEMPERATURE_MIN,
  WARDROBE_CATEGORIES,
} from '@klotho/shared';
import { z } from 'zod';

export const GARMENT_TOOL = 'record_garment';

export const LANGUAGES = { fr: 'French', en: 'English' } as const;

const SUBCATEGORY_HINT = Object.entries(SUBCATEGORIES)
  .map(([category, values]) => `${category}: ${values.join(', ')}`)
  .join('; ');

/** The keys whose meaning is not obvious from their name. */
const STYLE_HINT = [
  'y2k: early 2000s (low rise, baby tees, butterflies)',
  'parisian: effortless French chic (Breton stripes, trench, ballet flats)',
  'oldMoney: quiet luxury (cashmere, pleats, navy and camel)',
  'coquette: bows, lace, ruffles, soft pinks',
  'cottagecore: rural, puff sleeves, small florals, gingham',
  'artsy: creative, unusual cuts or prints',
  'evening: night out, party, cocktail',
  'vintage50s / vintage60s: shapes of these decades',
  'victorian: high necks, lace, corsets, long skirts',
].join('; ');

/** The structured answer the AI must give (enums keep it in our vocabulary). */
export const GARMENT_SCHEMA = {
  type: 'object',
  properties: {
    isGarment: {
      type: 'boolean',
      description:
        'False when the photo shows no clothing item, shoes, bag, accessory or jewel.',
    },
    name: {
      type: 'string',
      description:
        'Short name as one would write it in a wardrobe app, at most 6 words, without brand.',
    },
    category: { type: 'string', enum: WARDROBE_CATEGORIES },
    subcategory: {
      type: 'string',
      enum: [...new Set(Object.values(SUBCATEGORIES).flat())],
      description: `Must belong to the category. ${SUBCATEGORY_HINT}. Omit if none fits.`,
    },
    primaryColor: {
      type: 'string',
      enum: COLOR_KEYS,
      description: 'The dominant colour of the piece (not of the background).',
    },
    secondaryColors: {
      type: 'array',
      items: { type: 'string', enum: COLOR_KEYS },
      maxItems: 3,
      description: 'Other clearly visible colours of the piece, if any.',
    },
    pattern: { type: 'string', enum: PATTERNS },
    material: {
      type: 'string',
      description:
        'Main material when it can be seen (e.g. cotton, denim, wool, leather, lace). Omit if unsure.',
    },
    styles: {
      type: 'array',
      items: { type: 'string', enum: STYLES },
      minItems: 1,
      maxItems: 3,
      description: `The styles the piece fits best, best first. ${STYLE_HINT}.`,
    },
    seasons: {
      type: 'array',
      items: { type: 'string', enum: SEASONS },
      minItems: 1,
      maxItems: 4,
    },
    minTemperature: {
      type: 'integer',
      minimum: TEMPERATURE_MIN,
      maximum: TEMPERATURE_MAX,
      description:
        'Coldest outdoor temperature (°C) at which the piece is comfortable. Omit for bags and jewels.',
    },
    maxTemperature: {
      type: 'integer',
      minimum: TEMPERATURE_MIN,
      maximum: TEMPERATURE_MAX,
      description: 'Warmest outdoor temperature (°C) for the piece.',
    },
    warmthLevel: {
      type: 'integer',
      minimum: LEVEL_MIN,
      maximum: LEVEL_MAX,
      description: '1 very light to 5 very warm.',
    },
    formalityLevel: {
      type: 'integer',
      minimum: LEVEL_MIN,
      maximum: LEVEL_MAX,
      description: '1 very casual to 5 very dressy.',
    },
  },
  // Asked every time: some models skip optional fields. On a photo without
  // any piece, isGarment false makes the rest ignored.
  required: [
    'isGarment',
    'name',
    'category',
    'subcategory',
    'primaryColor',
    'pattern',
    'styles',
    'seasons',
    'warmthLevel',
    'formalityLevel',
  ],
} as const;

export const GARMENT_INSTRUCTIONS = [
  'You catalogue the pieces of a personal wardrobe for the Klotho app.',
  'Look at the photo and describe the main piece it shows (the most prominent one if there are several), only from what you can see.',
  `Always answer with the ${GARMENT_TOOL} tool.`,
  'Fill every field with your best estimate, as a stylist would: name, category, sub-category, colours, pattern, styles, seasons, temperature range and levels.',
  'Only leave out the material when it cannot be seen, and the temperatures for bags and jewels.',
].join(' ');

/** The line sent with the photo. */
export const photoRequest = (language: keyof typeof LANGUAGES) =>
  `Write the name and the material in ${LANGUAGES[language]}.`;

/** The only field required in the answer; the others are checked later. */
export const garmentAnswer = z.looseObject({ isGarment: z.boolean() });
