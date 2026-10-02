// Types and cross-cutting validators shared by the API and the mobile app.

export * from './auth/schemas';
export * from './auth/types';
export * from './wardrobe/schemas';
export * from './wardrobe/taxonomy';
export * from './wardrobe/types';
export * from './preferences/schemas';
export * from './weather/schemas';
export * from './outfits/taxonomy';
export * from './outfits/schemas';
export * from './outfits/planning';

export type HealthStatus = 'ok';

export interface HealthResponse {
  status: HealthStatus;
}
