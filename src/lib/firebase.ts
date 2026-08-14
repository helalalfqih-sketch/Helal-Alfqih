/**
 * Supabase Migration Bridge
 * All database operations are now powered by Supabase.
 */
export {
  supabase,
  isSupabaseConfigured,
  seedInitialProductsIfNeeded,
  subscribeToProducts,
  subscribeToOrders,
  createSupabaseOrder as createFirestoreOrder,
  saveSupabaseProduct as saveFirestoreProduct,
  deleteSupabaseProduct as deleteFirestoreProduct,
  updateSupabaseOrderStatus as updateFirestoreOrderStatus,
  deleteSupabaseOrder as deleteFirestoreOrder,
} from './supabase';
