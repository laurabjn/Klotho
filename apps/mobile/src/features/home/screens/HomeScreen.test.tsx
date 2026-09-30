import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import { signIn } from '@/features/auth/store/auth.store';
import { renderWithProviders, session } from '@/testing/render';

import { HomeScreen } from './HomeScreen';

jest.mock('@/features/auth/api/auth.api');
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

describe('HomeScreen', () => {
  beforeEach(async () => {
    await signIn(session);
  });

  it('greets the user by first name', async () => {
    await renderWithProviders(<HomeScreen />);

    expect(
      screen.getByRole('header', { name: 'Bonjour Laura' }),
    ).toBeOnTheScreen();
  });

  it('offers to add a piece', async () => {
    await renderWithProviders(<HomeScreen />);

    await fireEvent.press(
      screen.getByRole('button', { name: 'Ajouter une pièce' }),
    );

    expect(router.push).toHaveBeenCalledWith('/piece/new');
  });
});
