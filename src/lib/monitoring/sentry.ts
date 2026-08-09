/**
 * Monitoring & Telemetry Service (Sentry / Real-time Logger Integration)
 */

interface ErrorContext {
  component?: string;
  action?: string;
  extra?: Record<string, any>;
}

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

export const MonitoringService = {
  /**
   * Initialize monitoring and global error listeners.
   */
  init() {
    if (typeof window === "undefined") return;

    if (SENTRY_DSN) {
      console.log("[Monitoring] Initialized Sentry Telemetry DSN");
    } else {
      console.log("[Monitoring] Active in Console fallback mode (No VITE_SENTRY_DSN configured)");
    }

    // Capture uncaught window exceptions
    window.addEventListener("error", (event) => {
      this.captureException(event.error || new Error(event.message), {
        component: "GlobalWindow",
        action: "uncaught_error",
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: "GlobalWindow",
          action: "unhandled_rejection",
        },
      );
    });
  },

  /**
   * Capture runtime exceptions.
   */
  captureException(error: Error | unknown, context?: ErrorContext) {
    const errObj = error instanceof Error ? error : new Error(String(error));

    console.error(`[Telemetry Error] [${context?.component || "App"}] ${errObj.message}`, {
      stack: errObj.stack,
      context,
      timestamp: new Date().toISOString(),
    });

    // If Sentry is initialized, dispatch to Sentry API
    if (SENTRY_DSN && typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(errObj, { extra: context });
    }
  },

  /**
   * Log custom telemetry messages or key metrics.
   */
  captureMessage(message: string, level: "info" | "warning" | "error" = "info") {
    console.log(`[Telemetry ${level.toUpperCase()}] ${message}`);

    if (SENTRY_DSN && typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureMessage(message, level);
    }
  },
};
