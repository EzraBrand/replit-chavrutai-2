import posthog from 'posthog-js';

let isInitialized = false;

export const initAnalytics = () => {
  const apiKey = import.meta.env.VITE_POSTHOG_API_KEY;
  const apiHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

  if (!apiKey) {
    console.warn('Missing required PostHog key: VITE_POSTHOG_API_KEY');
    return;
  }

  if (isInitialized) return;

  posthog.init(apiKey, {
    api_host: apiHost,
    autocapture: true,
    capture_pageview: false,
    capture_pageleave: true,
    persistence: 'localStorage',
    disable_session_recording: false,
  });

  isInitialized = true;
};

export const trackPageView = (url: string) => {
  if (!isInitialized) return;
  
  posthog.capture('$pageview', {
    $current_url: window.location.origin + url,
  });
};

export const trackEvent = (
  action: string, 
  category?: string, 
  label?: string, 
  value?: number
) => {
  if (!isInitialized) return;
  
  posthog.capture(action, {
    category,
    label,
    value,
  });
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!isInitialized) return;
  
  posthog.identify(userId, properties);
};

export const optOutTracking = () => {
  if (!isInitialized) return;
  
  posthog.opt_out_capturing();
  localStorage.setItem('analytics_opt_out', 'true');
};

export const optInTracking = () => {
  if (!isInitialized) return;
  
  posthog.opt_in_capturing();
  localStorage.removeItem('analytics_opt_out');
};

export const isOptedOut = (): boolean => {
  return localStorage.getItem('analytics_opt_out') === 'true';
};

export const getPostHog = () => posthog;
