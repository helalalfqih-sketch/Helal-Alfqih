import { supabase } from "@/integrations/supabase/client";

/**
 * Perform secure user logout:
 * 1. Purge legacy Service Worker private caches (supabase-api-cache, private-query-cache)
 * 2. Execute Supabase auth signOut
 * 3. Clear local storage / session storage user state
 */
export async function performSecureLogout(redirectUrl: string = "/auth"): Promise<void> {
  try {
    // 1. Purge legacy Workbox & private caches from CacheStorage API
    if ("caches" in window) {
      const keys = await caches.keys();
      const privateCacheNames = [
        "supabase-api-cache",
        "authenticated-api-cache",
        "private-query-cache",
      ];
      await Promise.all(
        keys
          .filter((name) => privateCacheNames.includes(name) || name.includes("api-cache"))
          .map((name) => caches.delete(name))
      );
    }
  } catch (err) {
    console.warn("[performSecureLogout] Warning clearing CacheStorage:", err);
  }

  try {
    // 2. Sign out Supabase auth session
    await supabase.auth.signOut();
  } catch (err) {
    console.error("[performSecureLogout] Supabase signOut error:", err);
  }

  // 3. Clear local storage keys
  try {
    localStorage.removeItem("supabase.auth.token");
  } catch {}

  // 4. Redirect user
  window.location.href = redirectUrl;
}
