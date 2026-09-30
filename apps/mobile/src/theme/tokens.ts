// Design tokens sampled from the Klotho mockups (Klotho_maquette).

export const colors = {
  background: '#FBF7F2',
  surface: '#FCF8F3',
  input: '#F8F0E8',
  border: '#EFE4DA',
  primary: '#B07869',
  primaryPressed: '#9C6658',
  primaryLight: '#EFD9D0',
  onPrimary: '#FFF9F5',
  title: '#3E231C',
  body: '#6B5048',
  muted: '#816A60',
  placeholder: '#9A8A85',
  link: '#9A4A40',
  gold: '#C9A27A',
  error: '#B3443F',
  success: '#7E7249',
  shadow: '#6E4533',
} as const;

export const fonts = {
  serif: 'CormorantGaramond_500Medium',
  serifRegular: 'CormorantGaramond_400Regular',
  serifSemiBold: 'CormorantGaramond_600SemiBold',
  sans: 'Jost_400Regular',
  sansLight: 'Jost_300Light',
  sansMedium: 'Jost_500Medium',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
} as const;

export const radii = {
  input: 16,
  card: 20,
  sheet: 28,
  pill: 999,
} as const;

/** Minimum touch target (WCAG / platform guidelines). */
export const touchTarget = 48;
