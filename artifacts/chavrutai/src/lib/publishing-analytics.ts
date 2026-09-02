export type PublishingAnalyticsData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: {
      track(name: string, data?: PublishingAnalyticsData): void;
    };
  }
}

export function trackPublishingEvent(
  name: string,
  data?: PublishingAnalyticsData,
): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem("analytics_opt_out") === "true") return;

  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never interrupt reading or navigation.
  }
}