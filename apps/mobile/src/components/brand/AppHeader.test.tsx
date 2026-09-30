import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { signIn } from '@/features/auth/store/auth.store';
import { renderWithProviders, session } from '@/testing/render';

import { AppHeader } from './AppHeader';

jest.mock('@/features/auth/api/auth.api');
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }));

describe('AppHeader', () => {
  it('opens the profile from the avatar', async () => {
    await signIn(session);
    await renderWithProviders(<AppHeader />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Ouvrir mon profil' }),
    );

    expect(router.navigate).toHaveBeenCalledWith('/me');
  });
});
