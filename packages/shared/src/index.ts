// Types and cross-cutting validators shared by the API and the mobile app.

export type HealthStatus = 'ok';

export interface HealthResponse {
  status: HealthStatus;
}
