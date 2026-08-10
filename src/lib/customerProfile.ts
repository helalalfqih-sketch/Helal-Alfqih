/**
 * customerProfile.ts — localStorage-based customer profile (no Firebase)
 * Orders are fetched from Supabase via existing order-functions.
 */
import { OrderStatus } from '@/components/storefront/types';

export interface SavedAddress {
  id: string;
  label: 'منزل' | 'عمل' | 'آخر';
  governorate: string;
  address: string;
  nearestLandmark?: string;
  recipientName: string;
  recipientPhone: string;
  isDefault: boolean;
}

export interface CustomerProfile {
  uid: string;
  fullName: string;
  phone: string;
  altPhone?: string;
  preferredGovernorate: string;
  deliveryInstructions?: string;
  autofillEnabled: boolean;
  preferredPaymentMethod?: string;
  addresses: SavedAddress[];
  updatedAt?: string;
}

export interface GuestDeviceProfile {
  fullName: string;
  phone: string;
  altPhone?: string;
  governorate: string;
  address: string;
  nearestLandmark?: string;
  deliveryInstructions?: string;
  rememberDevice: boolean;
}

const PROFILE_STORAGE_KEY = 'indexes_customer_profile_v2';
const GUEST_STORAGE_KEY = 'indexes_guest_profile_v2';
const CHECKOUT_DRAFT_KEY = 'indexes_checkout_draft_v1';

/**
 * Converts Arabic/Eastern digits (٠١٢٣٤٥٦٧٨٩) to standard digits (0123456789)
 */
export function normalizePhoneDigits(input: string): string {
  if (!input) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  let result = input;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }
  return result;
}

/**
 * Format phone string for presentation or masking
 */
export function maskPhoneNumber(phone: string): string {
  const clean = normalizePhoneDigits(phone).replace(/[^\d]/g, '');
  if (clean.length < 6) return phone;
  const start = clean.slice(0, 3);
  const end = clean.slice(-2);
  return `${start}****${end}`;
}

/**
 * Fetch customer profile — localStorage only
 */
export async function getCustomerProfile(uid: string): Promise<CustomerProfile | null> {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(`${PROFILE_STORAGE_KEY}_${uid}`);
    if (!raw) return null;
    return JSON.parse(raw) as CustomerProfile;
  } catch {
    return null;
  }
}

/**
 * Save/update customer profile — localStorage only
 */
export async function saveCustomerProfile(
  uid: string,
  profileData: Partial<CustomerProfile>
): Promise<CustomerProfile> {
  if (!uid) throw new Error('User ID is required to save profile');

  const existing = await getCustomerProfile(uid);

  const updatedProfile: CustomerProfile = {
    uid,
    fullName: profileData.fullName ?? existing?.fullName ?? '',
    phone: normalizePhoneDigits(profileData.phone ?? existing?.phone ?? ''),
    altPhone: profileData.altPhone !== undefined ? normalizePhoneDigits(profileData.altPhone) : existing?.altPhone,
    preferredGovernorate: profileData.preferredGovernorate ?? existing?.preferredGovernorate ?? 'أمانة العاصمة صنعاء',
    deliveryInstructions: profileData.deliveryInstructions ?? existing?.deliveryInstructions,
    autofillEnabled: profileData.autofillEnabled ?? existing?.autofillEnabled ?? true,
    preferredPaymentMethod: profileData.preferredPaymentMethod ?? existing?.preferredPaymentMethod ?? 'cash',
    addresses: profileData.addresses ?? existing?.addresses ?? [],
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`${PROFILE_STORAGE_KEY}_${uid}`, JSON.stringify(updatedProfile));
  return updatedProfile;
}

/**
 * Add a new saved address to customer profile
 */
export async function addCustomerAddress(
  uid: string,
  newAddress: Omit<SavedAddress, 'id'>
): Promise<SavedAddress[]> {
  const profile = await getCustomerProfile(uid);
  const existingAddresses = profile?.addresses || [];

  const addressId = `addr_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
  const created: SavedAddress = {
    ...newAddress,
    id: addressId,
    recipientPhone: newAddress.recipientPhone ? normalizePhoneDigits(newAddress.recipientPhone) : '',
    isDefault: newAddress.isDefault || existingAddresses.length === 0,
  };

  let updatedList = [...existingAddresses];
  if (created.isDefault) {
    updatedList = updatedList.map((a) => ({ ...a, isDefault: false }));
  }
  updatedList.push(created);

  await saveCustomerProfile(uid, { addresses: updatedList });
  return updatedList;
}

/**
 * Delete a saved address
 */
export async function deleteCustomerAddress(uid: string, addressId: string): Promise<SavedAddress[]> {
  const profile = await getCustomerProfile(uid);
  if (!profile) return [];

  let updatedList = profile.addresses.filter((a) => a.id !== addressId);
  if (updatedList.length > 0 && !updatedList.some((a) => a.isDefault)) {
    updatedList[0].isDefault = true;
  }

  await saveCustomerProfile(uid, { addresses: updatedList });
  return updatedList;
}

/**
 * Set default address
 */
export async function setDefaultCustomerAddress(uid: string, addressId: string): Promise<SavedAddress[]> {
  const profile = await getCustomerProfile(uid);
  if (!profile) return [];

  const updatedList = profile.addresses.map((a) => ({
    ...a,
    isDefault: a.id === addressId,
  }));

  await saveCustomerProfile(uid, { addresses: updatedList });
  return updatedList;
}

/**
 * Real-time-like subscription to customer orders via localStorage cache
 * (Actual real-time done via useSuspenseQuery in routes)
 */
export function subscribeToCustomerOrders(
  _userId: string,
  callback: (orders: OrderStatus[], loading: boolean, error?: string) => void
): () => void {
  // Return cached orders from localStorage if any
  try {
    const raw = localStorage.getItem('indexes_user_orders_cache');
    const cached = raw ? (JSON.parse(raw) as OrderStatus[]) : [];
    callback(cached, false);
  } catch {
    callback([], false);
  }
  return () => {};
}

/**
 * Local storage guest profile helpers
 */
export function getGuestDeviceProfile(): GuestDeviceProfile | null {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GuestDeviceProfile;
  } catch {
    return null;
  }
}

export function saveGuestDeviceProfile(profile: GuestDeviceProfile): void {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.warn('Failed to save guest profile to localStorage', e);
  }
}

export function clearGuestDeviceProfile(): void {
  try {
    localStorage.removeItem(GUEST_STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear guest profile', e);
  }
}

/**
 * Checkout Draft local storage helpers
 */
export function saveCheckoutDraft(draft: Record<string, unknown>): void {
  try {
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
  } catch (e) {
    console.warn('Failed to save checkout draft', e);
  }
}

export function getCheckoutDraft(): Record<string, unknown> | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCheckoutDraft(): void {
  try {
    localStorage.removeItem(CHECKOUT_DRAFT_KEY);
  } catch (e) {
    console.warn('Failed to clear checkout draft', e);
  }
}
