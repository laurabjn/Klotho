import type {
  AuthSession,
  AuthTokens,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UserProfile,
} from '@klotho/shared';

import { request } from '@/lib/api/http';

export const authApi = {
  register: (body: RegisterInput) =>
    request<AuthSession>('/auth/register', { method: 'POST', body }),
  login: (body: LoginInput) =>
    request<AuthSession>('/auth/login', { method: 'POST', body }),
  refresh: (refreshToken: string) =>
    request<AuthTokens>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),
  logout: (refreshToken: string) =>
    request<void>('/auth/logout', { method: 'POST', body: { refreshToken } }),
  forgotPassword: (body: ForgotPasswordInput) =>
    request<void>('/auth/forgot-password', { method: 'POST', body }),
  resetPassword: (body: ResetPasswordInput) =>
    request<void>('/auth/reset-password', { method: 'POST', body }),
  me: () => request<UserProfile>('/users/me', { auth: true }),
  /** RGPD: erases the account and all its data (password required). */
  deleteAccount: (password: string) =>
    request<void>('/users/me', {
      method: 'DELETE',
      body: { password },
      auth: true,
    }),
};
