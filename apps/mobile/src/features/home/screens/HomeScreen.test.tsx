import { render, screen } from '@testing-library/react-native';

import i18n from '@/i18n';

import { HomeScreen } from './HomeScreen';

describe('HomeScreen', () => {
  it('renders the welcome title in French', async () => {
    await i18n.changeLanguage('fr');
    await render(<HomeScreen />);

    expect(
      screen.getByRole('header', { name: 'Bienvenue dans ton dressing' }),
    ).toBeOnTheScreen();
  });

  it('renders the welcome title in English', async () => {
    await i18n.changeLanguage('en');
    await render(<HomeScreen />);

    expect(
      screen.getByRole('header', { name: 'Welcome to your wardrobe' }),
    ).toBeOnTheScreen();
  });
});
