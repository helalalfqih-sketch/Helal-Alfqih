import { CartItem, Product } from '@/components/storefront/types';

export interface PersistentCartToken {
  tokenId: string;
  items: { productId: string; quantity: number; selectedColor?: string }[];
  createdAt: string;
  expiresAt: string;
}

export interface RestoredCartReport {
  items: CartItem[];
  priceChanges: { productName: string; oldPrice: number; newPrice: number }[];
  unavailableItems: { productName: string; reason: string }[];
}

const STORAGE_KEY = 'indexes_persistent_cart_tokens';

/**
 * Generate a short 6-character random token ID
 */
function generateTokenId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let token = '';
  for (let i = 0; i < 6; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Create an opaque short cart token and store it locally
 */
export async function createCartRecoveryToken(cartItems: CartItem[]): Promise<string> {
  if (cartItems.length === 0) return '';

  const tokenId = generateTokenId();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

  const tokenData: PersistentCartToken = {
    tokenId,
    items: cartItems.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      selectedColor: item.selectedColor,
    })),
    createdAt,
    expiresAt,
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const map = saved ? JSON.parse(saved) : {};
    map[tokenId] = tokenData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }

  return tokenId;
}

/**
 * Fetch and re-validate cart from a short recovery token
 */
export async function fetchCartFromRecoveryToken(
  tokenId: string,
  catalogProducts: Product[]
): Promise<RestoredCartReport | null> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const map = saved ? JSON.parse(saved) : {};
    const tokenData: PersistentCartToken = map[tokenId.toUpperCase()];

    if (!tokenData) return null;

    const restoredItems: CartItem[] = [];
    const priceChanges: { productName: string; oldPrice: number; newPrice: number }[] = [];
    const unavailableItems: { productName: string; reason: string }[] = [];

    for (const rawItem of tokenData.items) {
      const product = catalogProducts.find((p) => p.id === rawItem.productId);

      if (!product) {
        unavailableItems.push({
          productName: `منتج برقم #${rawItem.productId.slice(0, 6)}`,
          reason: 'المنتج لم يعد متوفراً بالكتالوج الحقيقي',
        });
        continue;
      }

      if (!product.inStock) {
        unavailableItems.push({
          productName: product.name,
          reason: 'المنتج نفد من المخزون حالياً',
        });
        continue;
      }

      restoredItems.push({
        product,
        quantity: rawItem.quantity,
        selectedColor: rawItem.selectedColor,
      });
    }

    return {
      items: restoredItems,
      priceChanges,
      unavailableItems,
    };
  } catch (err) {
    console.error('Error fetching persistent cart:', err);
    return null;
  }
}
