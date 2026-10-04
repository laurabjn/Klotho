import type { BillingStatus } from '@klotho/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PurchasesPackage } from 'react-native-purchases';

import { useAuthStore } from '@/features/auth/store/auth.store';

import { billingApi } from '../api/billing.api';
import {
  buy,
  purchasesAvailable,
  restore,
  storePackages,
} from '../lib/purchases';

export const billingKeys = {
  status: ['billing', 'status'] as const,
  packages: ['billing', 'packages'] as const,
};

export function useBillingStatus() {
  return useQuery({ queryKey: billingKeys.status, queryFn: billingApi.status });
}

/** The store's products and prices (none in Expo Go). */
export function useStorePackages() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: billingKeys.packages,
    queryFn: () => storePackages(userId!),
    enabled: purchasesAvailable && !!userId,
    staleTime: 10 * 60 * 1000,
  });
}

/** What a plan unlocks reaches every screen: limits, credits, history. */
function useApplyStatus() {
  const queryClient = useQueryClient();
  return async (status: BillingStatus) => {
    queryClient.setQueryData(billingKeys.status, status);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['ai'] }),
      queryClient.invalidateQueries({ queryKey: ['outfits', 'history'] }),
    ]);
  };
}

/** Buys a product, then lets the server confirm it with the store. */
export function usePurchase() {
  const userId = useAuthStore((s) => s.user?.id);
  const apply = useApplyStatus();
  return useMutation({
    mutationFn: async (pack: PurchasesPackage) => {
      if (!(await buy(userId!, pack))) return null;
      return billingApi.sync();
    },
    onSuccess: (status) => (status ? apply(status) : undefined),
  });
}

export function useRestorePurchases() {
  const userId = useAuthStore((s) => s.user?.id);
  const apply = useApplyStatus();
  return useMutation({
    mutationFn: async () => {
      await restore(userId!);
      return billingApi.sync();
    },
    onSuccess: apply,
  });
}
