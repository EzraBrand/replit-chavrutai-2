import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

import { CANONICAL_BASE_URL } from "@shared/brand";

export const SITE_URL = CANONICAL_BASE_URL;

export function getBaseUrl(): string {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    // In local development, use the dev origin so links/assets resolve.
    return window.location.origin;
  }
  // In production, always use the canonical domain for metadata/share URLs,
  // even if the page is being served from a legacy domain.
  return SITE_URL;
}
