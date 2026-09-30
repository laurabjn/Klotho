// Types and cross-cutting validators shared by the API and the mobile app.

export * from './auth/schemas';
export * from './auth/types';

export type HealthStatus = 'ok';

export interface HealthResponse {
  status: HealthStatus;
}
