import { logLiveErrorFn, generateSuggestedFix, ErrorTypeCategory } from "@/services/live-logs.service";

interface CapturerOptions {
  errorName: string;
  errorType?: ErrorTypeCategory | string;
  level?: "error" | "warn" | "fatal" | "info";
  location?: string;
  cause: string;
  suggestedFix?: string;
  stackTrace?: string;
  context?: Record<string, any>;
}

// In-memory set for deduplicating identical errors within 5 seconds
const recentlyLoggedErrors = new Set<string>();

/**
 * Report a live error from anywhere in the application (Client or Server).
 */
export async function reportLiveError(opts: CapturerOptions): Promise<void> {
  try {
    const loc = opts.location || (typeof window !== "undefined" ? window.location.pathname : "System/Server");
    const dedupeKey = `${opts.errorName}:${opts.cause}:${loc}`;

    if (opts.level !== "info" && recentlyLoggedErrors.has(dedupeKey)) {
      return; // Skip duplicate error flooding
    }

    if (opts.level !== "info") {
      recentlyLoggedErrors.add(dedupeKey);
      setTimeout(() => recentlyLoggedErrors.delete(dedupeKey), 1500);
    }

    const isStorefront = typeof window !== "undefined" && !window.location.pathname.startsWith("/admin");
    const defaultType = isStorefront ? "Storefront UI" : "Admin UI";

    const errorType = opts.errorType || defaultType;
    const suggestedFix =
      opts.suggestedFix ||
      generateSuggestedFix(opts.errorName, opts.cause, loc, opts.stackTrace, errorType);

    await logLiveErrorFn({
      data: {
        errorName: opts.errorName,
        errorType,
        level: opts.level || "error",
        location: loc,
        cause: opts.cause,
        suggestedFix,
        stackTrace: opts.stackTrace || (new Error().stack || ""),
        context: {
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Server",
          url: typeof window !== "undefined" ? window.location.href : "Server",
          ...(opts.context || {}),
        },
      },
    });
  } catch (err) {
    // Soft catch to prevent recursive error loops
    console.warn("Failed to report live error:", err);
  }
}

/**
 * Interceptor for Supabase operations to log any Postgrest / Auth errors.
 */
export async function captureSupabaseError<T>(
  promise: Promise<{ data: T | null; error: any }>,
  locationName: string
): Promise<{ data: T | null; error: any }> {
  const result = await promise;
  if (result.error) {
    const err = result.error;
    reportLiveError({
      errorName: err.code ? `SupabaseError [${err.code}]` : "SupabaseDBError",
      errorType: "Supabase DB",
      level: "error",
      location: locationName,
      cause: err.message || err.details || "فشل تنفيذ الاستعلام في سوبا بيس",
      stackTrace: `Code: ${err.code || "N/A"}\nMessage: ${err.message || ""}\nDetails: ${err.details || ""}\nHint: ${err.hint || ""}`,
      context: { code: err.code, details: err.details, hint: err.hint },
    });
  }
  return result;
}

/**
 * Interceptor for GitHub API / Webhook integration operations.
 */
export async function captureGitHubError<T>(
  action: () => Promise<T>,
  locationName: string
): Promise<T> {
  try {
    return await action();
  } catch (err: any) {
    const message = err?.message || String(err);
    reportLiveError({
      errorName: err?.name || "GitHubAPIError",
      errorType: "GitHub Integration",
      level: "error",
      location: locationName,
      cause: message,
      stackTrace: err?.stack || JSON.stringify(err, null, 2),
      context: { status: err?.status, response: err?.response },
    });
    throw err;
  }
}

/**
 * Initialize global client window error listeners for unhandled errors & promise rejections.
 */
export function initGlobalLiveErrorListeners(): void {
  if (typeof window === "undefined") return;

  const globalWin = window as any;
  if (globalWin.__LIVE_LOGS_INITIALIZED__) return;
  globalWin.__LIVE_LOGS_INITIALIZED__ = true;

  window.addEventListener("error", (event) => {
    const loc = window.location.pathname;
    const isStorefront = !loc.startsWith("/admin");
    const errorType = isStorefront ? "Storefront UI" : "Admin UI";

    reportLiveError({
      errorName: event.error?.name || "UnhandledClientError",
      errorType,
      level: "error",
      location: `${loc} (${event.filename}:${event.lineno}:${event.colno})`,
      cause: event.message || "حدث خطأ غير متوقع في واجهة المستخدم",
      stackTrace: event.error?.stack || `File: ${event.filename}:${event.lineno}:${event.colno}`,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    const loc = window.location.pathname;
    const isStorefront = !loc.startsWith("/admin");
    const errorType = isStorefront ? "Storefront UI" : "Admin UI";
    const reason = event.reason;

    const causeMsg =
      typeof reason === "string"
        ? reason
        : reason?.message || "فشل وعد برمجيات غير معالج (Unhandled Promise Rejection)";

    reportLiveError({
      errorName: reason?.name || "UnhandledPromiseRejection",
      errorType,
      level: "error",
      location: loc,
      cause: causeMsg,
      stackTrace: reason?.stack || (typeof reason === "object" ? JSON.stringify(reason, null, 2) : String(reason)),
    });
  });

  // Intercept browser window fetch requests to stream all network activity into Live Console
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const input = args[0];
    const init = args[1];
    const urlStr = typeof input === "string" ? input : input instanceof Request ? input.url : String(input);
    const method = (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();

    const response = await originalFetch.apply(this, args);

    try {
      if (urlStr.includes("indexes-store") || urlStr.startsWith("/") || urlStr.startsWith("http")) {
        const urlObj = new URL(urlStr, window.location.origin);
        const path = urlObj.pathname;
        if (!path.includes("live-logs") && !path.includes("listLiveLogs")) {
          let level: "info" | "warn" | "error" = "info";
          if (response.status >= 500) level = "error";
          else if (response.status >= 400) level = "warn";

          let cause = `HTTP ${response.status} ${method} ${path}`;
          if (path.includes("image-proxy")) {
            const target = urlObj.searchParams.get("url");
            try {
              const h = target ? new URL(target).hostname : "unknown";
              cause = `[IMAGE_PROXY] { hostname: '${h}' }`;
            } catch {
              cause = `[IMAGE_PROXY] ${method} ${path}`;
            }
          } else if (path.includes("_serverFn")) {
            cause = `[ServerFn] ${method} ${path.substring(0, 30)}...`;
          }

          reportLiveError({
            errorName: `[${method}] ${path}`,
            errorType: path.startsWith("/api") ? "Server Function" : "Admin UI",
            level,
            location: path,
            cause,
            context: { method, status: response.status, host: urlObj.hostname || "indexes-store.vercel.app", path },
          });
        }
      }
    } catch {
      // ignore
    }

    return response;
  };
}
