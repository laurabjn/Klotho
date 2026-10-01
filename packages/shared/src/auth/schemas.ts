import { z } from 'zod';

// Error messages are i18n keys: the mobile app translates them, the API returns them as-is.

/** bcrypt ignores everything after 72 bytes, so longer passwords are refused. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'errors.email.invalid' }));

export interface PasswordRule {
  /** i18n key, used both as validation error and as checklist label on mobile. */
  key: `errors.password.${string}`;
  test: (value: string) => boolean;
}

/** The rules a new password must satisfy, in the order they are displayed. */
export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    key: 'errors.password.tooShort',
    test: (value) => value.length >= PASSWORD_MIN_LENGTH,
  },
  {
    key: 'errors.password.uppercase',
    test: (value) => /\p{Lu}/u.test(value),
  },
  {
    key: 'errors.password.lowercase',
    test: (value) => /\p{Ll}/u.test(value),
  },
  { key: 'errors.password.digit', test: (value) => /\p{N}/u.test(value) },
  {
    key: 'errors.password.special',
    test: (value) => /[^\p{L}\p{N}\s]/u.test(value),
  },
];

export const passwordSchema = z.string().superRefine((value, ctx) => {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(value)) ctx.addIssue({ code: 'custom', message: rule.key });
  }
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) {
    ctx.addIssue({ code: 'custom', message: 'errors.password.tooLong' });
  }
});

const firstNameSchema = z
  .string()
  .trim()
  .min(1, { error: 'errors.firstName.required' })
  .max(50, { error: 'errors.firstName.tooLong' });

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: firstNameSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'errors.password.required' }),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutSchema = refreshTokenSchema;

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

export const BIO_MAX = 200;

export const updateProfileSchema = z.object({
  firstName: firstNameSchema.optional(),
  /** "Bio" of "Modifier mon profil"; an empty text removes it. */
  bio: z
    .string()
    .trim()
    .max(BIO_MAX, { error: 'errors.bio.tooLong' })
    .nullable()
    .optional()
    .transform((value) => (value === '' ? null : value)),
  avatarUrl: z
    .url({ protocol: /^https$/, error: 'errors.avatarUrl.invalid' })
    .nullable()
    .optional(),
});

/** PUT /users/me/avatar: a photo uploaded with POST /uploads/wardrobe. */
export const setAvatarSchema = z.object({
  key: z.string().min(1).max(200),
});

/**
 * POST /users/me/password: the current password, then the new one. Every
 * other session is signed out; the answer is a fresh session.
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, { error: 'errors.password.required' }),
  newPassword: passwordSchema,
});

/**
 * POST /users/me/email: a confirmation link is sent to the new address; the
 * address changes once the link is opened (POST /auth/confirm-email).
 */
export const changeEmailSchema = z.object({
  newEmail: emailSchema,
  password: z.string().min(1, { error: 'errors.password.required' }),
});

export const confirmEmailChangeSchema = z.object({
  token: z.string().min(1),
});

/** DELETE /users/me: the current password confirms the deletion of the account. */
export const deleteAccountSchema = z.object({
  password: z.string().min(1, { error: 'errors.password.required' }),
});

// Form variants: the confirmation field only exists client-side.

const confirmationMatches = {
  check: (value: { password: string; confirmPassword: string }) =>
    value.password === value.confirmPassword,
  params: {
    path: ['confirmPassword'],
    error: 'errors.password.mismatch',
  },
};

export const registerFormSchema = registerSchema
  .extend({ confirmPassword: z.string() })
  .refine(confirmationMatches.check, confirmationMatches.params);

export const resetPasswordFormSchema = z
  .object({ password: passwordSchema, confirmPassword: z.string() })
  .refine(confirmationMatches.check, confirmationMatches.params);

export const changePasswordFormSchema = changePasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    error: 'errors.password.mismatch',
  });

export type RegisterFormInput = z.infer<typeof registerFormSchema>;
export type ChangePasswordFormInput = z.infer<typeof changePasswordFormSchema>;
export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type SetAvatarInput = z.infer<typeof setAvatarSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ChangeEmailInput = z.input<typeof changeEmailSchema>;
export type ConfirmEmailChangeInput = z.infer<typeof confirmEmailChangeSchema>;
