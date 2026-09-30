import type { TranslationResource } from './fr';
import { onboardingEn, preferencesEn } from './preferences.en';
import { wardrobeEn } from './wardrobe.en';

export const en: TranslationResource = {
  common: {
    appName: 'Klotho',
    loading: 'Loading…',
    error: 'Something went wrong.',
    retry: 'Retry',
    cancel: 'Cancel',
    or: 'or',
    back: 'Back',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
  auth: {
    fields: {
      firstName: 'First name',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm password',
      newPassword: 'New password',
    },
    login: {
      title: 'More than a wardrobe,\na version of you.',
      overline: 'Create, organise and wear\na style that feels like you.',
      forgotPassword: 'Forgot password?',
      submit: 'Sign in',
      createAccount: 'Create an account',
    },
    register: {
      title: 'Create\nan account',
      overline: 'Start weaving\nyour fashion world',
      body: 'Join Klotho for a personal, inspiring and stylish experience.',
      submit: 'Create my account',
      haveAccount: 'I already have an account',
    },
    forgotPassword: {
      title: 'Forgot password',
      body: "Enter your email address and we'll send you a link to reset your password.",
      hint: "We'll send a reset link to this address. Remember to check your spam folder.",
      submit: 'Send the link',
      backToLogin: 'Back to sign in',
      sentTitle: 'Check your inbox',
      sentBody:
        'If an account exists for {{email}}, you will receive a link to choose a new password. It is valid for one hour.',
      resend: 'Resend the link',
    },
    resetPassword: {
      title: 'New\npassword',
      body: 'Choose a new password to secure your account and continue your Klotho experience.',
      submit: 'Update my password',
      missingToken:
        'This link is incomplete. Open the link from the email again, or request a new one.',
      requestNewLink: 'Request a new link',
    },
    passwordChanged: {
      title: 'Password changed',
      body: 'Your password has been updated. You can now sign in to your Klotho account securely.',
      login: 'Sign in',
    },
    passwordRules: {
      title: 'Your password must contain:',
    },
    logout: {
      action: 'Sign out',
      confirmTitle: 'Sign out?',
      confirmBody:
        'You will need to sign in again to access your account and your wardrobe.',
    },
  },
  tabs: {
    home: 'Home',
    wardrobe: 'My wardrobe',
    inspirations: 'Inspiration',
    calendar: 'Calendar',
    me: 'Me',
  },
  comingSoon: {
    title: 'Coming soon',
    body: 'This part of Klotho is coming in a future version.',
  },
  wardrobe: wardrobeEn,
  onboarding: onboardingEn,
  preferences: preferencesEn,
  home: {
    greeting: 'Hello {{firstName}}',
    overline: 'Ready to write a new story today?',
    title: 'Welcome to your wardrobe',
    subtitle: 'Outfits built from the pieces you actually own.',
  },
  errors: {
    email: { invalid: 'Invalid email address' },
    firstName: {
      required: 'Enter your first name',
      tooLong: '50 characters maximum',
    },
    password: {
      required: 'Enter your password',
      tooShort: 'At least 8 characters',
      uppercase: 'One uppercase letter',
      lowercase: 'One lowercase letter',
      digit: 'One number',
      special: 'One special character (e.g. ! ? @ # $ %)',
      tooLong: 'Password too long',
      mismatch: 'Passwords do not match',
    },
    avatarUrl: { invalid: 'Invalid image' },
    preferences: {
      metal: 'Unknown metal',
      bottoms: 'Unknown choice',
      length: 'Unknown length',
      colorConflict: 'A colour cannot be both a favourite and to avoid',
    },
    wardrobe: {
      category: 'Choose a category',
      color: 'Choose a colour',
      style: 'Unknown style',
      season: 'Unknown season',
      status: 'Unknown status',
      pattern: 'Unknown pattern',
      level: 'Choose a level between 1 and 5',
      temperature: 'Between -30 °C and 50 °C',
      temperatureRange: 'The maximum must be above the minimum',
      tooLong: 'Text too long',
      tooMany: 'Too many choices',
    },
  },
  apiErrors: {
    uploads: {
      invalidImage: 'This file is not a valid photo (JPEG, PNG or WEBP).',
      tooLarge: 'This photo is too large.',
      notFound: 'The photo could not be added. Try again.',
      missingFile: 'No photo was sent.',
    },
    auth: {
      emailAlreadyUsed: 'An account already exists with this email.',
      invalidCredentials: 'Incorrect email or password.',
      invalidRefreshToken: 'Your session has expired. Please sign in again.',
      invalidResetToken:
        'This link has expired or was already used. Request a new one.',
      unauthorized: 'Your session has expired. Please sign in again.',
    },
    wardrobe: {
      photoLimitReached:
        'You reached the maximum number of photos for this piece.',
      photoNotFound: 'This photo no longer exists.',
      notFound: 'This piece no longer exists.',
      invalidTemperatureRange: 'The maximum must be above the minimum.',
    },
    validation: { failed: 'Some fields are invalid.' },
    request: { tooMany: 'Too many attempts. Try again in a few minutes.' },
    network:
      'Cannot reach the server. Check your internet connection and try again.',
    unknown: 'Something went wrong. Try again in a moment.',
  },
};
