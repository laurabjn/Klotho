import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import type { PurchasesPackage } from 'react-native-purchases';

import { signIn } from '@/features/auth/store/auth.store';
import { renderWithProviders, session } from '@/testing/render';

import { billingApi } from '../api/billing.api';
import { buy, restore, storePackages } from '../lib/purchases';
import { billingStatus } from '../testing';
import { PremiumScreen } from './PremiumScreen';

jest.mock('../api/billing.api');
jest.mock('../lib/purchases', () => ({
  purchasesAvailable: true,
  storePackages: jest.fn(),
  buy: jest.fn(),
  restore: jest.fn(),
  MANAGE_SUBSCRIPTIONS_URL:
    'https://play.google.com/store/account/subscriptions',
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const api = jest.mocked(billingApi);
const pack = (identifier: string, priceString: string) =>
  ({
    identifier,
    product: { identifier, priceString },
  }) as unknown as PurchasesPackage;
const PACKAGES = new Map(
  [
    pack('klotho_premium_annual', '32,99 €'),
    pack('klotho_premium_monthly', '4,99 €'),
    pack('klotho_founders', '49,99 €'),
    pack('klotho_credits_25', '1,99 €'),
    pack('klotho_credits_75', '3,99 €'),
  ].map((p) => [p.product.identifier, p]),
);

/** Only the store gives this price: its products are loaded, buttons on. */
const storeLoaded = () => screen.findByText('1,99 €');

const press = (name: string | RegExp) =>
  fireEvent.press(screen.getByRole('button', { name }));

describe('PremiumScreen', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await signIn(session);
    api.status.mockResolvedValue(billingStatus());
    jest.mocked(storePackages).mockResolvedValue(PACKAGES);
  });

  it('compares the plans with the limits of the server', async () => {
    await renderWithProviders(<PremiumScreen />);

    expect(
      await screen.findByLabelText(
        'Pièces dans ton dressing : Gratuit 100, Premium Illimité',
      ),
    ).toBeOnTheScreen();
    expect(
      screen.getByLabelText(
        'Analyses photo IA : Gratuit 3 offertes, Premium 25 / mois',
      ),
    ).toBeOnTheScreen();
    // The yearly plan is chosen first, with the store's price.
    const annual = await screen.findByRole('radio', {
      name: /Annuel, 32,99 €/,
    });
    expect(annual.props.accessibilityState).toMatchObject({ selected: true });
  });

  it('buys the chosen plan, then lets the server confirm it', async () => {
    jest.mocked(buy).mockResolvedValue(true);
    api.sync.mockResolvedValue(
      billingStatus({
        plan: 'founders',
        limits: { pieces: null, generationsPerWeek: null, historyDays: null },
      }),
    );
    await renderWithProviders(<PremiumScreen />);
    await storeLoaded();

    await fireEvent.press(
      screen.getByRole('radio', { name: /Founders, 49,99 €/ }),
    );
    await press('Continuer');

    await waitFor(() => expect(api.sync).toHaveBeenCalled());
    expect(buy).toHaveBeenCalledWith('user-1', PACKAGES.get('klotho_founders'));
    expect(
      await screen.findByText(/Tu fais partie des Founders/),
    ).toBeOnTheScreen();
  });

  it('changes nothing when the store sheet is closed', async () => {
    jest.mocked(buy).mockResolvedValue(false);
    await renderWithProviders(<PremiumScreen />);
    await storeLoaded();

    await press('Continuer');

    await waitFor(() => expect(buy).toHaveBeenCalled());
    expect(api.sync).not.toHaveBeenCalled();
  });

  it('buys a pack of AI credits', async () => {
    jest.mocked(buy).mockResolvedValue(true);
    api.sync.mockResolvedValue(billingStatus());
    await renderWithProviders(<PremiumScreen />);
    await storeLoaded();

    await fireEvent.press(
      screen.getAllByRole('button', { name: 'Acheter' })[1]!,
    );

    await waitFor(() =>
      expect(buy).toHaveBeenCalledWith(
        'user-1',
        PACKAGES.get('klotho_credits_75'),
      ),
    );
  });

  it('restores the purchases', async () => {
    jest.mocked(restore).mockResolvedValue(undefined);
    api.sync.mockResolvedValue(billingStatus());
    await renderWithProviders(<PremiumScreen />);

    await press('Restaurer mes achats');

    await waitFor(() => expect(api.sync).toHaveBeenCalled());
    expect(restore).toHaveBeenCalledWith('user-1');
  });

  it('shows the current subscription instead of the offers', async () => {
    api.status.mockResolvedValue(
      billingStatus({ plan: 'premium', expiresAt: '2027-10-01T08:00:00.000Z' }),
    );
    await renderWithProviders(<PremiumScreen />);

    expect(await screen.findByText(/Tu es Premium jusqu’au/)).toBeOnTheScreen();
    expect(
      screen.getByRole('button', { name: 'Gérer mon abonnement' }),
    ).toBeOnTheScreen();
    expect(
      screen.queryByRole('radio', { name: /Annuel/ }),
    ).not.toBeOnTheScreen();
  });

  it('shows the end of the founders offer, then hides it', async () => {
    api.status.mockResolvedValue(
      billingStatus({
        offer: {
          ...billingStatus().offer,
          foundersUntil: '2026-12-31',
        },
      }),
    );
    await renderWithProviders(<PremiumScreen />);

    expect(
      await screen.findByRole('radio', { name: /Founders.*Jusqu’au/ }),
    ).toBeOnTheScreen();
  });

  it('does not sell founders once the offer is over', async () => {
    api.status.mockResolvedValue(
      billingStatus({
        offer: { ...billingStatus().offer, foundersOnSale: false },
      }),
    );
    await renderWithProviders(<PremiumScreen />);
    await screen.findByRole('radio', { name: /Annuel/ });

    expect(
      screen.queryByRole('radio', { name: /Founders/ }),
    ).not.toBeOnTheScreen();
  });
});
