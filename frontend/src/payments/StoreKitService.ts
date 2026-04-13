import { Platform } from 'react-native';

// Product IDs for Apple App Store IAP
export const PRODUCT_IDS = {
  PRO_MONTHLY: 'com.seekconsultingltd.fahmiq.pro.monthly',
  PRO_YEARLY: 'com.seekconsultingltd.fahmiq.pro.yearly',
  ULTRA_MONTHLY: 'com.seekconsultingltd.fahmiq.ultra.monthly',
  ULTRA_YEARLY: 'com.seekconsultingltd.fahmiq.ultra.yearly',
} as const;

export interface Product {
  productId: string;
  title: string;
  description: string;
  price: string;
  localizedPrice: string;
  currency: string;
}

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  error?: string;
}

// Dynamic import for react-native-iap (only available in native builds)
let RNIap: any = null;

async function loadIAP(): Promise<boolean> {
  if (RNIap) return true;
  if (Platform.OS !== 'ios') return false;
  try {
    RNIap = await import('react-native-iap');
    return true;
  } catch {
    console.log('[StoreKit] react-native-iap not available — requires native build');
    return false;
  }
}

export class StoreKitService {
  private initialized = false;
  private products: Product[] = [];

  async initialize(): Promise<boolean> {
    const available = await loadIAP();
    if (!available) {
      console.log('[StoreKit] IAP not available in this environment');
      this.initialized = false;
      return false;
    }

    try {
      await RNIap.initConnection();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('[StoreKit] Init failed:', error);
      return false;
    }
  }

  async getProducts(): Promise<Product[]> {
    if (!this.initialized || !RNIap) {
      // Return product definitions for UI display
      return [
        {
          productId: PRODUCT_IDS.PRO_MONTHLY,
          title: 'FahmIQ Pro — Monthly',
          description: 'Unlimited queries, all model bands, priority processing',
          price: '9.99',
          localizedPrice: '$9.99',
          currency: 'USD',
        },
        {
          productId: PRODUCT_IDS.PRO_YEARLY,
          title: 'FahmIQ Pro — Yearly',
          description: 'Save 40% with annual billing',
          price: '71.99',
          localizedPrice: '$71.99',
          currency: 'USD',
        },
        {
          productId: PRODUCT_IDS.ULTRA_MONTHLY,
          title: 'FahmIQ Ultra — Monthly',
          description: 'Everything in Pro + Precision models + Autonomous tasks',
          price: '19.99',
          localizedPrice: '$19.99',
          currency: 'USD',
        },
        {
          productId: PRODUCT_IDS.ULTRA_YEARLY,
          title: 'FahmIQ Ultra — Yearly',
          description: 'Save 40% with annual billing',
          price: '143.99',
          localizedPrice: '$143.99',
          currency: 'USD',
        },
      ];
    }

    try {
      const productIds = Object.values(PRODUCT_IDS);
      const subscriptions = await RNIap.getSubscriptions({ skus: productIds });
      this.products = subscriptions.map((s: any) => ({
        productId: s.productId,
        title: s.title,
        description: s.description,
        price: s.price,
        localizedPrice: s.localizedPrice,
        currency: s.currency,
      }));
      return this.products;
    } catch (error) {
      console.error('[StoreKit] Get products failed:', error);
      return [];
    }
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.initialized || !RNIap) {
      return { success: false, error: 'StoreKit not available — requires iOS device' };
    }

    try {
      const purchase = await RNIap.requestSubscription({ sku: productId });
      if (purchase) {
        await RNIap.finishTransaction({ purchase, isConsumable: false });
        return {
          success: true,
          productId,
          transactionId: purchase.transactionId,
        };
      }
      return { success: false, error: 'Purchase cancelled' };
    } catch (error: any) {
      return { success: false, error: error.message || 'Purchase failed' };
    }
  }

  async restorePurchases(): Promise<PurchaseResult[]> {
    if (!this.initialized || !RNIap) {
      return [{ success: false, error: 'StoreKit not available' }];
    }

    try {
      const purchases = await RNIap.getAvailablePurchases();
      return purchases.map((p: any) => ({
        success: true,
        productId: p.productId,
        transactionId: p.transactionId,
      }));
    } catch (error: any) {
      return [{ success: false, error: error.message }];
    }
  }

  async disconnect(): Promise<void> {
    if (RNIap && this.initialized) {
      try {
        await RNIap.endConnection();
      } catch { /* ignore */ }
    }
  }
}

export const storeKitService = new StoreKitService();

// Entitlement Manager
export class EntitlementManager {
  private tier: 'free' | 'pro' | 'ultra' = 'free';

  setTier(tier: 'free' | 'pro' | 'ultra') {
    this.tier = tier;
  }

  getTier() {
    return this.tier;
  }

  canUseModelBand(band: 'fast' | 'balanced' | 'precision'): boolean {
    if (band === 'fast') return true;
    if (band === 'balanced') return this.tier !== 'free';
    if (band === 'precision') return this.tier === 'ultra';
    return false;
  }

  canUseDeepTasks(): boolean {
    return this.tier !== 'free';
  }

  canUseAutomation(): boolean {
    return this.tier === 'ultra';
  }

  getDailyQueryLimit(): number {
    if (this.tier === 'free') return 10;
    if (this.tier === 'pro') return 100;
    return 999;
  }

  getFeatures(): string[] {
    const features = ['Fast model (Qwen 0.5B)', 'Basic Ask mode', '10 queries/day'];
    if (this.tier === 'pro' || this.tier === 'ultra') {
      features.push('Balanced model (Qwen 1.5B)', 'Deep Tasks', 'Unlimited queries', 'Web search', 'Workspace');
    }
    if (this.tier === 'ultra') {
      features.push('Precision model (Qwen 3B)', 'Autonomous Director', 'Automation rules', 'Priority processing');
    }
    return features;
  }
}

export const entitlementManager = new EntitlementManager();
