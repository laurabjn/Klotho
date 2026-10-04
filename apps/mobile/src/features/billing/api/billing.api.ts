import type { BillingStatus } from '@klotho/shared';

import { request } from '@/lib/api/http';

export const billingApi = {
  status: () => request<BillingStatus>('/billing/status', { auth: true }),
  /** After a purchase or a restore: the server asks the store again. */
  sync: () =>
    request<BillingStatus>('/billing/sync', { method: 'POST', auth: true }),
};
