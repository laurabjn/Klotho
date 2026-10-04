import { StoreUnavailableError } from '../../domain/billing/errors';
import { RevenueCatCustomers } from './revenuecat-customers';

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

const subscriber = {
  request_date: '2026-10-01T08:00:00Z',
  subscriber: {
    original_app_user_id: 'user-laura',
    entitlements: {
      premium: {
        expires_date: '2027-10-01T08:00:00Z',
        product_identifier: 'klotho_premium_annual',
        purchase_date: '2026-10-01T08:00:00Z',
      },
      founders: {
        expires_date: null,
        product_identifier: 'klotho_founders',
        purchase_date: '2026-10-01T08:00:00Z',
      },
    },
    non_subscriptions: {
      klotho_credits_25: [
        { id: 'rc1', store_transaction_id: 'GPA.1', purchase_date: 'x' },
        { id: 'rc2', store_transaction_id: null, purchase_date: 'x' },
      ],
    },
    subscriptions: {},
  },
};

describe('RevenueCatCustomers', () => {
  let fetchMock: jest.Mock<Promise<Response>, [URL, RequestInit]>;
  const customers = (secretKey: string | undefined = 'sk_secret') =>
    new RevenueCatCustomers({ secretKey, timeoutMs: 1000 }, fetchMock);

  beforeEach(() => {
    fetchMock = jest.fn<Promise<Response>, [URL, RequestInit]>();
  });

  it('reads the entitlements and the one-time purchases', async () => {
    fetchMock.mockReturnValue(json(subscriber));

    await expect(customers().get('user-laura')).resolves.toEqual({
      entitlements: [
        {
          id: 'premium',
          productId: 'klotho_premium_annual',
          expiresAt: new Date('2027-10-01T08:00:00Z'),
        },
        { id: 'founders', productId: 'klotho_founders', expiresAt: null },
      ],
      purchases: [
        { productId: 'klotho_credits_25', transactionId: 'GPA.1' },
        // Without a store id, RevenueCat's own id still identifies it.
        { productId: 'klotho_credits_25', transactionId: 'rc2' },
      ],
    });
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url.href).toBe(
      'https://api.revenuecat.com/v1/subscribers/user-laura',
    );
    expect(init.headers).toEqual({ authorization: 'Bearer sk_secret' });
  });

  it('is unavailable without a key, without calling RevenueCat', async () => {
    await expect(customers('').get('user-laura')).rejects.toBeInstanceOf(
      StoreUnavailableError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ['an error status', () => json({ message: 'nope' }, 500)],
    ['a network failure', () => Promise.reject(new TypeError('fetch failed'))],
    ['an unexpected answer', () => json({ hello: 'world' })],
  ])('is unavailable on %s', async (_case, reply) => {
    fetchMock.mockImplementation(reply);

    await expect(customers().get('user-laura')).rejects.toBeInstanceOf(
      StoreUnavailableError,
    );
  });
});
