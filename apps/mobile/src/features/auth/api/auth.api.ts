import type {
  AuthSession,
  AuthTokens,
  ChangeEmailInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  UpdateProfileInput,
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
  updateProfile: (body: UpdateProfileInput) =>
    request<UserProfile>('/users/me', { method: 'PATCH', body, auth: true }),
  /** The photo was uploaded first (POST /uploads/wardrobe). */
  setAvatar: (key: string) =>
    request<UserProfile>('/users/me/avatar', {
      method: 'PUT',
      body: { key },
      auth: true,
    }),
  removeAvatar: () =>
    request<UserProfile>('/users/me/avatar', { method: 'DELETE', auth: true }),
  /** Signs the other devices out: the answer is a fresh session. */
  changePassword: (body: ChangePasswordInput) =>
    request<AuthSession>('/users/me/password', {
      method: 'POST',
      body,
      auth: true,
    }),
  /** Sends a confirmation link to the new address. */
  changeEmail: (body: ChangeEmailInput) =>
    request<void>('/users/me/email', { method: 'POST', body, auth: true }),
  /** Opened from the confirmation e-mail, signed in or not. */
  confirmEmail: (token: string) =>
    request<{ email: string } | undefined>('/auth/confirm-email', {
      method: 'POST',
      body: { token },
    }),
  /** RGPD: erases the account and all its data (password required). */
  deleteAccount: (password: string) =>
    request<void>('/users/me', {
      method: 'DELETE',
      body: { password },
      auth: true,
    }),
};
