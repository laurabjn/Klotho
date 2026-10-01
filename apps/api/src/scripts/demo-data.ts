// Demo account to try the app by hand (`npm run db:seed:demo -w @klotho/api`).
import type {
  City,
  ColorKey,
  DislikeReason,
  Occasion,
  OutfitRating,
  Pattern,
  Season,
  Style,
  StyleProfileInput,
  WardrobeCategory,
  WardrobeStatus,
  WeatherCondition,
} from '@klotho/shared';

export const DEMO_ACCOUNT = {
  email: 'demo@klotho.fr',
  password: 'Klotho2026!',
  firstName: 'Camille',
};

export const DEMO_PROFILE: StyleProfileInput = {
  preferredStyles: ['romantic', 'chic', 'parisian'],
  preferredColors: ['powderPink', 'ecru', 'sand', 'oldRose'],
  avoidedColors: ['mustard'],
  facePreferredColors: ['powderPink', 'ecru'],
  colorSeason: 'spring',
  preferredMetals: ['gold', 'roseGold'],
  acceptsHeels: true,
  preferredBottoms: ['skirts', 'dresses'],
  preferredFormality: 3,
  minLength: 'knee',
  avoidsDeepNeckline: null,
};

export const DEMO_CITY: City = {
  name: 'Paris',
  country: 'FR',
  region: 'Île-de-France',
  latitude: 48.86,
  longitude: 2.35,
};

export interface DemoItem {
  name: string;
  category: WardrobeCategory;
  subcategory: string;
  primaryColor: ColorKey;
  secondaryColors?: ColorKey[];
  pattern?: Pattern;
  material?: string;
  styles?: Style[];
  seasons?: Season[];
  minTemperature?: number;
  maxTemperature?: number;
  warmthLevel?: number;
  formalityLevel?: number;
  brand?: string;
  status?: WardrobeStatus;
  /** Times worn, and days since the last time (none = never worn). */
  worn?: { count: number; daysAgo: number };
  /** "Mes pièces favorites". */
  favorite?: boolean;
}

const ALL_YEAR: Season[] = ['spring', 'summer', 'autumn', 'winter'];
const WARM: Season[] = ['spring', 'summer'];
const COLD: Season[] = ['autumn', 'winter'];

/** A varied wardrobe: every category, statuses, and a wear history. */
export const DEMO_WARDROBE: DemoItem[] = [
  // Hauts
  {
    name: 'Blouse romantique',
    favorite: true,
    category: 'TOP',
    subcategory: 'blouse',
    primaryColor: 'white',
    material: 'Coton',
    styles: ['romantic', 'cottagecore'],
    seasons: WARM,
    warmthLevel: 2,
    formalityLevel: 3,
    worn: { count: 12, daysAgo: 1 },
  },
  {
    name: 'T-shirt blanc',
    category: 'TOP',
    subcategory: 'tshirt',
    primaryColor: 'white',
    styles: ['casual', 'minimalist'],
    seasons: ALL_YEAR,
    warmthLevel: 1,
    formalityLevel: 1,
    worn: { count: 30, daysAgo: 3 },
  },
  {
    name: 'Chemise rayée',
    category: 'TOP',
    subcategory: 'shirt',
    primaryColor: 'skyBlue',
    secondaryColors: ['white'],
    pattern: 'striped',
    styles: ['classic', 'parisian'],
    seasons: ALL_YEAR,
    warmthLevel: 2,
    formalityLevel: 3,
    worn: { count: 8, daysAgo: 10 },
  },
  {
    name: 'Pull en maille',
    category: 'TOP',
    subcategory: 'sweater',
    primaryColor: 'ecru',
    material: 'Laine',
    styles: ['casual', 'cottagecore'],
    seasons: COLD,
    warmthLevel: 4,
    formalityLevel: 2,
    worn: { count: 15, daysAgo: 20 },
  },
  {
    name: 'Col roulé noir',
    category: 'TOP',
    subcategory: 'sweater',
    primaryColor: 'black',
    styles: ['minimalist', 'chic'],
    seasons: COLD,
    warmthLevel: 4,
    formalityLevel: 3,
    worn: { count: 6, daysAgo: 40 },
  },
  {
    name: 'Top à bretelles',
    category: 'TOP',
    subcategory: 'tankTop',
    primaryColor: 'powderPink',
    styles: ['romantic'],
    seasons: ['summer'],
    warmthLevel: 1,
    formalityLevel: 2,
  },
  {
    name: 'Chemise en soie',
    category: 'TOP',
    subcategory: 'shirt',
    primaryColor: 'sand',
    material: 'Soie',
    styles: ['chic', 'evening'],
    seasons: ALL_YEAR,
    warmthLevel: 2,
    formalityLevel: 4,
    status: 'WASHING',
    worn: { count: 4, daysAgo: 2 },
  },
  {
    name: 'Cardigan vieux rose',
    category: 'TOP',
    subcategory: 'cardigan',
    primaryColor: 'oldRose',
    styles: ['romantic', 'vintage'],
    seasons: ['spring', 'autumn'],
    warmthLevel: 3,
    formalityLevel: 2,
  },

  // Bas
  {
    name: 'Jean droit',
    category: 'BOTTOM',
    subcategory: 'jeans',
    primaryColor: 'denim',
    brand: "Levi's",
    styles: ['casual'],
    seasons: ALL_YEAR,
    warmthLevel: 3,
    formalityLevel: 2,
    worn: { count: 40, daysAgo: 1 },
  },
  {
    name: 'Jupe midi satinée',
    favorite: true,
    category: 'BOTTOM',
    subcategory: 'midiSkirt',
    primaryColor: 'nudePink',
    material: 'Satin',
    styles: ['romantic', 'chic'],
    seasons: ['spring', 'summer', 'autumn'],
    warmthLevel: 2,
    formalityLevel: 3,
    worn: { count: 5, daysAgo: 15 },
  },
  {
    name: 'Pantalon tailleur',
    category: 'BOTTOM',
    subcategory: 'trousers',
    primaryColor: 'black',
    styles: ['business', 'chic'],
    seasons: ALL_YEAR,
    warmthLevel: 3,
    formalityLevel: 4,
    worn: { count: 10, daysAgo: 7 },
  },
  {
    name: 'Pantalon large en lin',
    category: 'BOTTOM',
    subcategory: 'trousers',
    primaryColor: 'linen',
    material: 'Lin',
    styles: ['minimalist', 'boho'],
    seasons: WARM,
    warmthLevel: 1,
    formalityLevel: 3,
  },
  {
    name: 'Jupe plissée longue',
    category: 'BOTTOM',
    subcategory: 'longSkirt',
    primaryColor: 'sage',
    styles: ['boho', 'vintage'],
    seasons: ['spring', 'autumn'],
    warmthLevel: 2,
    formalityLevel: 2,
    worn: { count: 2, daysAgo: 60 },
  },
  {
    name: 'Short en jean',
    category: 'BOTTOM',
    subcategory: 'shorts',
    primaryColor: 'denim',
    styles: ['casual'],
    seasons: ['summer'],
    warmthLevel: 1,
    formalityLevel: 1,
    status: 'ARCHIVED',
  },

  // Robes
  {
    name: 'Robe fleurie',
    favorite: true,
    category: 'DRESS',
    subcategory: 'midiDress',
    primaryColor: 'powderPink',
    secondaryColors: ['sage'],
    pattern: 'floral',
    styles: ['romantic', 'cottagecore'],
    seasons: WARM,
    warmthLevel: 2,
    formalityLevel: 2,
    worn: { count: 7, daysAgo: 30 },
  },
  {
    name: 'Petite robe noire',
    category: 'DRESS',
    subcategory: 'eveningDress',
    primaryColor: 'black',
    styles: ['evening', 'chic'],
    seasons: ALL_YEAR,
    warmthLevel: 2,
    formalityLevel: 5,
    worn: { count: 3, daysAgo: 90 },
  },
  {
    name: 'Robe pull',
    category: 'DRESS',
    subcategory: 'casualDress',
    primaryColor: 'taupe',
    material: 'Maille',
    styles: ['casual', 'minimalist'],
    seasons: COLD,
    warmthLevel: 4,
    formalityLevel: 2,
  },

  // Vestes et manteaux
  {
    name: 'Blazer beige',
    category: 'LAYER',
    subcategory: 'blazer',
    primaryColor: 'sand',
    styles: ['chic', 'business', 'parisian'],
    seasons: ALL_YEAR,
    warmthLevel: 3,
    formalityLevel: 4,
    worn: { count: 20, daysAgo: 5 },
  },
  {
    name: 'Trench camel',
    favorite: true,
    category: 'LAYER',
    subcategory: 'trench',
    primaryColor: 'camel',
    styles: ['classic', 'parisian'],
    seasons: ['spring', 'autumn'],
    warmthLevel: 3,
    formalityLevel: 3,
    worn: { count: 9, daysAgo: 12 },
  },
  {
    name: 'Manteau en laine',
    category: 'LAYER',
    subcategory: 'coat',
    primaryColor: 'caramel',
    material: 'Laine',
    styles: ['classic', 'chic'],
    seasons: COLD,
    warmthLevel: 5,
    formalityLevel: 4,
  },
  {
    name: 'Doudoune',
    category: 'LAYER',
    subcategory: 'puffer',
    primaryColor: 'black',
    styles: ['casual', 'sporty'],
    seasons: ['winter'],
    warmthLevel: 5,
    formalityLevel: 1,
  },
  {
    name: 'Veste en jean',
    category: 'LAYER',
    subcategory: 'jacket',
    primaryColor: 'denim',
    styles: ['casual'],
    seasons: ['spring', 'summer', 'autumn'],
    warmthLevel: 2,
    formalityLevel: 1,
    status: 'LENT',
  },

  // Chaussures
  {
    name: 'Baskets blanches',
    category: 'SHOES',
    subcategory: 'sneakers',
    primaryColor: 'white',
    styles: ['casual', 'sporty'],
    seasons: ALL_YEAR,
    formalityLevel: 1,
    worn: { count: 50, daysAgo: 1 },
  },
  {
    name: 'Ballerines nude',
    favorite: true,
    category: 'SHOES',
    subcategory: 'flats',
    primaryColor: 'nudePink',
    styles: ['romantic', 'parisian'],
    seasons: WARM,
    formalityLevel: 3,
    worn: { count: 6, daysAgo: 25 },
  },
  {
    name: 'Escarpins noirs',
    category: 'SHOES',
    subcategory: 'pumps',
    primaryColor: 'black',
    styles: ['evening', 'chic'],
    seasons: ALL_YEAR,
    formalityLevel: 5,
    worn: { count: 2, daysAgo: 90 },
  },
  {
    name: 'Bottines camel',
    category: 'SHOES',
    subcategory: 'ankleBoots',
    primaryColor: 'caramel',
    styles: ['classic', 'boho'],
    seasons: COLD,
    formalityLevel: 3,
    worn: { count: 14, daysAgo: 8 },
  },
  {
    name: 'Sandales dorées',
    category: 'SHOES',
    subcategory: 'sandals',
    primaryColor: 'gold',
    styles: ['boho', 'evening'],
    seasons: ['summer'],
    formalityLevel: 3,
  },
  {
    name: 'Mocassins',
    category: 'SHOES',
    subcategory: 'loafers',
    primaryColor: 'chocolate',
    styles: ['classic', 'preppy'],
    seasons: ALL_YEAR,
    formalityLevel: 3,
    worn: { count: 11, daysAgo: 4 },
  },

  // Sacs
  {
    name: 'Sac à main taupe',
    category: 'BAG',
    subcategory: 'handbag',
    primaryColor: 'taupe',
    styles: ['chic', 'classic'],
    formalityLevel: 3,
    worn: { count: 25, daysAgo: 2 },
  },
  {
    name: 'Pochette dorée',
    category: 'BAG',
    subcategory: 'clutch',
    primaryColor: 'gold',
    styles: ['evening'],
    formalityLevel: 5,
  },
  {
    name: 'Cabas en toile',
    category: 'BAG',
    subcategory: 'tote',
    primaryColor: 'ecru',
    styles: ['casual'],
    formalityLevel: 1,
    worn: { count: 18, daysAgo: 6 },
  },

  // Bijoux et accessoires
  {
    name: 'Créoles dorées',
    favorite: true,
    category: 'JEWELRY',
    subcategory: 'earrings',
    primaryColor: 'gold',
    styles: ['chic', 'romantic'],
    worn: { count: 30, daysAgo: 3 },
  },
  {
    name: 'Collier argenté',
    category: 'JEWELRY',
    subcategory: 'necklace',
    primaryColor: 'silver',
    styles: ['minimalist'],
  },
  {
    name: 'Foulard en soie',
    category: 'ACCESSORY',
    subcategory: 'scarf',
    primaryColor: 'powderPink',
    pattern: 'floral',
    styles: ['parisian', 'vintage'],
    worn: { count: 4, daysAgo: 45 },
  },
  {
    name: 'Bonnet en laine',
    category: 'ACCESSORY',
    subcategory: 'beanie',
    primaryColor: 'ecru',
    styles: ['casual'],
    seasons: ['winter'],
  },

  // Sous-vêtements (jamais proposés dans une tenue)
  {
    name: 'Collants noirs',
    category: 'UNDERWEAR',
    subcategory: 'tights',
    primaryColor: 'black',
  },
];

export interface DemoLook {
  /** Names of pieces of DEMO_WARDROBE. */
  pieces: string[];
  style: Style | null;
  occasion: Occasion | null;
  temperature: number;
  condition: WeatherCondition;
  /** Days before today it was proposed. */
  daysAgo: number;
  favorite?: boolean;
  feedback?: { rating: OutfitRating; reasons?: DislikeReason[]; note?: string };
  /** Days before today it was worn (0 = today). */
  wornDaysAgo?: number[];
}

/**
 * Looks already proposed, with favourites, opinions and about 8 days worn
 * over the last 5 weeks (calendar, history, "Mes tenues").
 */
export const DEMO_LOOKS: DemoLook[] = [
  {
    pieces: [
      'Robe fleurie',
      'Trench camel',
      'Ballerines nude',
      'Sac à main taupe',
      'Créoles dorées',
    ],
    style: 'romantic',
    occasion: 'everyday',
    temperature: 16,
    condition: 'clear',
    daysAgo: 25,
    favorite: true,
    feedback: { rating: 'like' },
    wornDaysAgo: [25, 0],
  },
  {
    pieces: [
      'Blouse romantique',
      'Jupe midi satinée',
      'Trench camel',
      'Bottines camel',
      'Pochette dorée',
    ],
    style: 'romantic',
    occasion: 'date',
    temperature: 14,
    condition: 'cloudy',
    daysAgo: 33,
    favorite: true,
    wornDaysAgo: [33, 3],
  },
  {
    pieces: [
      'Chemise rayée',
      'Pantalon tailleur',
      'Blazer beige',
      'Mocassins',
      'Sac à main taupe',
    ],
    style: 'chic',
    occasion: 'work',
    temperature: 15,
    condition: 'cloudy',
    daysAgo: 18,
    feedback: { rating: 'like' },
    wornDaysAgo: [18, 1],
  },
  {
    pieces: [
      'Pull en maille',
      'Jean droit',
      'Baskets blanches',
      'Cabas en toile',
    ],
    style: 'casual',
    occasion: 'walk',
    temperature: 12,
    condition: 'cloudy',
    daysAgo: 7,
    wornDaysAgo: [7],
  },
  {
    pieces: [
      'Col roulé noir',
      'Jupe plissée longue',
      'Manteau en laine',
      'Bottines camel',
    ],
    style: 'chic',
    occasion: 'work',
    temperature: 8,
    condition: 'rain',
    daysAgo: 12,
    favorite: true,
    wornDaysAgo: [12],
  },
  {
    pieces: ['Petite robe noire', 'Escarpins noirs', 'Pochette dorée'],
    style: 'chic',
    occasion: 'evening',
    temperature: 18,
    condition: 'clear',
    daysAgo: 2,
    feedback: {
      rating: 'dislike',
      reasons: ['tooDressy', 'shoes'],
      note: 'Trop habillé pour un dîner entre amis.',
    },
  },
  {
    pieces: ['Robe pull', 'Bottines camel', 'Foulard en soie'],
    style: 'casual',
    occasion: 'everyday',
    temperature: 10,
    condition: 'fog',
    daysAgo: 1,
  },
  {
    pieces: ['T-shirt blanc', 'Pantalon large en lin', 'Sandales dorées'],
    style: 'casual',
    occasion: 'walk',
    temperature: 24,
    condition: 'clear',
    daysAgo: 0,
  },
];
