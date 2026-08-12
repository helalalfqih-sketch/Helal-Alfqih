import { STORE_INFO } from '@/components/storefront/constants';

export interface YemenAddress {
  id: string;
  recipientName: string;
  phone: string;
  governorate: string;
  district?: string;
  streetName: string;
  nearestLandmark: string;
  label: 'المنزل' | 'العمل' | 'هدية' | 'آخر';
  isDefault: boolean;
}

export const YEMEN_GOVERNORATES = STORE_INFO.governorates;

/**
 * Validate and normalize Yemeni phone numbers
 */
export function validateYemenPhone(rawPhone: string): { isValid: boolean; normalized: string; message?: string } {
  if (!rawPhone) return { isValid: false, normalized: '', message: 'يرجى إدخال رقم الهاتف' };

  let digits = rawPhone.replace(/\D/g, '');
  if (digits.startsWith('967')) digits = digits.slice(3);
  if (digits.startsWith('00967')) digits = digits.slice(5);

  if (digits.length === 10 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.length !== 9) {
    return {
      isValid: false,
      normalized: digits,
      message: 'رقم الهاتف يجب أن يتكون من 9 أرقام (مثال: 771370740)',
    };
  }

  const validPrefixes = ['77', '78', '73', '71', '70', '01', '02', '03', '04', '05', '06', '07'];
  const hasValidPrefix = validPrefixes.some((p) => digits.startsWith(p));

  if (!hasValidPrefix) {
    return {
      isValid: false,
      normalized: digits,
      message: 'يرجى إدخال رقم يمني يبدأ بـ (77, 78, 73, 71, 70) أو مفتاح محافظة أرضي',
    };
  }

  return { isValid: true, normalized: digits };
}

const STORAGE_KEY = 'indexes_saved_yemen_addresses';

export function getSavedAddressesLocal(): YemenAddress[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveAddressLocal(address: YemenAddress): YemenAddress[] {
  const current = getSavedAddressesLocal();
  let updated = current.filter((a) => a.id !== address.id);

  if (address.isDefault) {
    updated = updated.map((a) => ({ ...a, isDefault: false }));
  }

  updated.unshift(address);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save address:', err);
  }
  return updated;
}

export function deleteAddressLocal(addressId: string): YemenAddress[] {
  const current = getSavedAddressesLocal();
  const updated = current.filter((a) => a.id !== addressId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete address:', err);
  }
  return updated;
}

export function calculateYemenShipping(governorate: string, subtotalYER: number): number {
  if (subtotalYER >= STORE_INFO.freeShippingThresholdYER) return 0;
  if (governorate.includes('صنعاء')) return 2000;
  if (governorate.includes('عدن') || governorate.includes('تعز') || governorate.includes('إب')) return 3500;
  return 4500;
}
