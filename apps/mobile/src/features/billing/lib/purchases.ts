import { Platform } from 'react-native';
import type PurchasesModule from 'react-native-purchases';
import type { PurchasesPackage } from 'react-native-purchases';

import { inExpoGo } from '@/features/notifications/lib/phone-notifications';

/** Public SDK keys of RevenueCat (not secret), one per store. */
const API_KEY =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

type Purchases = typeof PurchasesModule;

let loaded: Purchases | null | undefined;
let configuredFor: string | null = null;

/**
 * Real purchases only exist in the installed app (beta build) with a key:
 * Expo Go has no store billing.
 */
export const purchasesAvailable = !inExpoGo && !!API_KEY;

function sdk(): Purchases | null {
  if (loaded === undefined)
    loaded = purchasesAvailable
      ? // eslint-disable-next-line @typescript-eslint/no-require-imports
        (require('react-native-purchases') as { default: Purchases }).default
      : null;
  return loaded;
}

/** The store customer is always the signed-in Klotho account. */
async function forUser(userId: string): Promise<Purchases> {
  const purchases = sdk();
  if (!purchases) throw new Error('purchases unavailable');
  if (configuredFor === null) {
    purchases.configure({ apiKey: API_KEY!, appUserID: userId });
  } else if (configuredFor !== userId) {
    await purchases.logIn(userId);
  }
  configuredFor = userId;
  return purchases;
}

/** Every product on sale, by store product id. */
export async function storePackages(
  userId: string,
): Promise<Map<string, PurchasesPackage>> {
  const purchases = await forUser(userId);
  const offerings = await purchases.getOfferings();
  const all = Object.values(offerings.all).flatMap((o) => o.availablePackages);
  return new Map(all.map((p) => [p.product.identifier, p]));
}

/** False when the buyer closed the store sheet. */
export async function buy(
  userId: string,
  pack: PurchasesPackage,
): Promise<boolean> {
  const purchases = await forUser(userId);
  try {
    await purchases.purchasePackage(pack);
    return true;
  } catch (error) {
    if ((error as { userCancelled?: boolean }).userCancelled) return false;
    throw error;
  }
}

export async function restore(userId: string): Promise<void> {
  await (await forUser(userId)).restorePurchases();
}

/** Where the store lets the user cancel or change a subscription. */
export const MANAGE_SUBSCRIPTIONS_URL =
  Platform.OS === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';
